export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface StreamChatOptions {
  model?: string
  json?: boolean
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
  onToken?: (token: string) => void
  onChunk?: (chunk: unknown) => void
}

const DEFAULT_MODEL = 'llama-3.1-8b-instant'
const GUIDANCE_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'guidance',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        next_best_thing: { type: 'string' },
        rationale: { type: 'string' },
        'follow-ups': {
          type: 'array',
          items: { type: 'string' }
        },
        followups: {
          type: 'array',
          items: { type: 'string' }
        },
        checklist_progress: {
          type: 'object',
          additionalProperties: {
            anyOf: [{ type: 'number' }, { type: 'boolean' }]
          }
        }
      },
      required: ['next_best_thing'],
      additionalProperties: true
    }
  }
} as const

const JSON_OBJECT_RESPONSE_FORMAT = { type: 'json_object' } as const

export async function streamChat(
  messages: ChatMessage[],
  {
    model = DEFAULT_MODEL,
    json = false,
    temperature = 0.3,
    maxTokens,
    signal,
    onToken,
    onChunk
  }: StreamChatOptions = {}
): Promise<string> {
  const base = import.meta.env.VITE_AI_URL
  if (!base) {
    throw new Error('Missing VITE_AI_URL environment variable')
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    stream: true,
    temperature
  }

  if (typeof maxTokens === 'number') {
    body.max_tokens = maxTokens
  }

  if (json) {
    body.response_format = GUIDANCE_RESPONSE_FORMAT ?? JSON_OBJECT_RESPONSE_FORMAT
  }

  const response = await fetch(`${base}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  })

  if (!response.ok || !response.body) {
    const message = !response.ok ? await response.text().catch(() => response.statusText) : 'Missing response body'
    throw new Error(`Groq chat error ${response.status}: ${message}`)
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const isEventStream = contentType.includes('text/event-stream')

  if (!isEventStream) {
    const text = await response.text()
    const trimmed = text.trim()
    if (trimmed && json) {
      try {
        const parsed = JSON.parse(trimmed)
        onChunk?.(parsed)
      } catch (error) {
        console.warn('Failed to parse Groq response as JSON', error)
      }
    } else if (trimmed && onToken) {
      onToken(trimmed)
    }
    return trimmed
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let aggregated = ''
  let buffer = ''

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const segments = buffer.split('\n\n')
      buffer = segments.pop() ?? ''

      for (const segment of segments) {
        const trimmed = segment.trim()
        if (!trimmed) continue
        const lines = trimmed.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (!data || data === '[DONE]') {
            continue
          }
          let parsed: any
          try {
            parsed = JSON.parse(data)
          } catch (error) {
            console.warn('Failed to parse Groq stream chunk', error)
            continue
          }

          onChunk?.(parsed)

          const choices = parsed?.choices
          if (!Array.isArray(choices)) continue
          for (const choice of choices) {
            const deltaContent = choice?.delta?.content
            if (typeof deltaContent === 'string' && deltaContent.length > 0) {
              aggregated += deltaContent
              onToken?.(deltaContent)
            }
            if (choice?.delta?.reasoning) {
              const reasoning = choice.delta.reasoning
              if (typeof reasoning === 'string') {
                onToken?.(reasoning)
              }
            }
            if (choice?.finish_reason === 'stop' || choice?.finish_reason === 'length') {
              // no-op; loop will end when stream completes
            }
            if (choice?.error) {
              const errMessage = choice.error?.message ?? 'Unknown streaming error'
              throw new Error(errMessage)
            }
          }
        }
      }
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error
    }
    throw new Error(`Groq stream failed: ${error?.message ?? error}`)
  } finally {
    reader.releaseLock()
  }

  return aggregated.trim()
}
