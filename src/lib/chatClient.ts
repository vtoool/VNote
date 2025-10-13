const DEFAULT_MODEL = 'gemini-2.0-flash'
const RETRY_DELAYS = [250, 500, 1000] as const

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatRequestOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  signal?: AbortSignal
  stop?: string[]
  response_format?: Record<string, unknown>
}

export interface ChatCompletion {
  content: string
  raw: unknown
  requestId?: string | null
}

export class ChatRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId?: string | null,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ChatRequestError'
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const readRequestId = (response: Response): string | null =>
  response.headers.get('x-request-id') ||
  response.headers.get('x-requestid') ||
  response.headers.get('x-cloud-trace-context')

export async function createChatCompletion(
  messages: ChatMessage[],
  opts: ChatRequestOptions = {}
): Promise<ChatCompletion> {
  const base = import.meta.env.VITE_AI_URL
  if (!base) {
    throw new Error('Missing VITE_AI_URL')
  }

  const body: Record<string, unknown> = {
    model: opts.model ?? DEFAULT_MODEL,
    messages
  }

  if (typeof opts.temperature === 'number') {
    body.temperature = opts.temperature
  }

  if (typeof opts.max_tokens === 'number') {
    body.max_tokens = opts.max_tokens
  }

  if (Array.isArray(opts.stop) && opts.stop.length > 0) {
    body.stop = opts.stop
  }

  if (opts.response_format) {
    body.response_format = opts.response_format
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      const response = await fetch(`${base}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: opts.signal
      })

      const requestId = readRequestId(response)

      if (!response.ok) {
        let message = response.statusText || 'Request failed'
        let details: unknown
        try {
          const parsed = await response.json()
          details = parsed
          const errorMessage = parsed?.error?.message || parsed?.message
          if (typeof errorMessage === 'string' && errorMessage.trim()) {
            message = errorMessage.trim()
          }
        } catch {
          // ignore JSON parse errors
        }

        const formatted = `Gemini request failed (${response.status}): ${message}`
        console.error(formatted, { requestId, details })

        if (response.status === 429 && attempt < RETRY_DELAYS.length) {
          await delay(RETRY_DELAYS[attempt])
          continue
        }

        throw new ChatRequestError(formatted, response.status, requestId, details)
      }

      let data: unknown
      let content = ''

      try {
        data = await response.json()
        const choice = (data as any)?.choices?.[0]
        content = choice?.message?.content ?? ''
        if (typeof content !== 'string') {
          content = ''
        }
      } catch (error) {
        throw new ChatRequestError('Failed to parse chat response JSON', response.status, requestId, error)
      }

      if (requestId) {
        console.debug('Gemini chat request', { requestId })
      }

      return {
        content,
        raw: data,
        requestId
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error
      }

      if (error instanceof ChatRequestError) {
        throw error
      }

      lastError = error
      if (attempt < RETRY_DELAYS.length) {
        await delay(RETRY_DELAYS[attempt])
        continue
      }
    }
  }

  throw new ChatRequestError(
    lastError instanceof Error ? lastError.message : 'Unknown chat error',
    0,
    undefined,
    lastError
  )
}

export { DEFAULT_MODEL }
