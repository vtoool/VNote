import type { ChatMessage } from '../lib/groq'

export const SALES_COACH_SYSTEM = `
You are VNote’s Sales Coach. You NEVER role-play the customer.
Your only job: propose the AGENT's next line based on the latest CUSTOMER input and the conversation state.

Rules:
- Do not write any "Customer:" lines. Ever.
- Respond with at most 1–2 sentences the agent can actually say next.
- Be natural, empathetic, and concise. No stage directions.
- Keep to the agreed sales approach (discovery-first, permission-based).
- If the last input is unclear, ask one clarifying question the AGENT can say.
- Language: match the agent’s current language.
- Output STRICT JSON only (no prose around it) following the provided schema.
`

export const COACH_STOP_SEQUENCES = ['\nCustomer:', '\nCUSTOMER:', '\nClient:', '\nProspect:', '\nUSER:'] as const

export const COACH_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'agent_coach_suggestion',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['agent_line', 'rationale', 'follow_ups'],
      properties: {
        agent_line: {
          type: 'string',
          description: 'What the AGENT should say next (1–2 sentences, spoken verbatim).'
        },
        rationale: {
          type: 'string',
          description: 'Why this is the right next line in 1 short sentence.'
        },
        follow_ups: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: { type: 'string' }
        }
      }
    }
  }
} as const satisfies Record<string, unknown>

export interface CoachSuggestionPayload {
  agent_line: string
  rationale: string
  follow_ups: string[]
}

export interface ProcessedCoachSuggestion {
  suggestion: CoachSuggestionPayload
  requiresReminder: boolean
}

export class CoachSuggestionError extends Error {
  constructor(
    message: string,
    public code: 'invalid_json' | 'missing_agent_line' | 'customer_roleplay'
  ) {
    super(message)
    this.name = 'CoachSuggestionError'
  }
}

const CUSTOMER_LABEL_REGEX = /\bcustomer\s*:/i
const SENTENCE_TERMINATORS = new Set(['.', '!', '?'])

export const sanitizeAgentLine = (line: string): string => {
  const collapsed = line.replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''
  const sentences: string[] = []
  let buffer = ''
  for (let index = 0; index < collapsed.length; index += 1) {
    const char = collapsed[index]
    buffer += char
    if (SENTENCE_TERMINATORS.has(char)) {
      sentences.push(buffer.trim())
      buffer = ''
      if (sentences.length >= 2) {
        break
      }
    }
  }
  if (sentences.length < 2 && buffer.trim()) {
    sentences.push(buffer.trim())
  }
  const limited = sentences.slice(0, 2)
  const result = limited.join(' ')
  return result.trim()
}

export function processCoachResponse(content: string): ProcessedCoachSuggestion {
  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new CoachSuggestionError('Coach response was not valid JSON', 'invalid_json')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CoachSuggestionError('Coach response had unexpected shape', 'invalid_json')
  }

  const agentLineRaw = typeof parsed.agent_line === 'string' ? parsed.agent_line.trim() : ''
  if (!agentLineRaw) {
    throw new CoachSuggestionError('Coach response missing agent_line', 'missing_agent_line')
  }

  const rationale = typeof parsed.rationale === 'string' ? parsed.rationale.trim() : ''
  const followUpsRaw = Array.isArray(parsed.follow_ups) ? parsed.follow_ups : []
  const followUps = followUpsRaw
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)

  const sanitizedLine = sanitizeAgentLine(agentLineRaw)
  if (!sanitizedLine) {
    throw new CoachSuggestionError('Coach response missing usable agent_line', 'missing_agent_line')
  }

  return {
    suggestion: {
      agent_line: sanitizedLine,
      rationale,
      follow_ups: followUps
    },
    requiresReminder: CUSTOMER_LABEL_REGEX.test(agentLineRaw)
  }
}

export const buildCoachMessages = (
  system: string,
  context: string,
  user: string
): ChatMessage[] => {
  const messages: ChatMessage[] = [{ role: 'system', content: system }]
  if (context.trim()) {
    messages.push({ role: 'system', content: context })
  }
  messages.push({ role: 'user', content: user })
  return messages
}

