import type { ChatMessage } from '../lib/chatClient'
import { parseCoach } from '../lib/coach/parse'
import type { CoachGuidance } from '../lib/coach/schema'

export const COACH_STOP_SEQUENCES = ['\nCustomer:', '\nCUSTOMER:', '\nClient:', '\nProspect:', '\nUSER:'] as const

export interface CoachSuggestionPayload extends CoachGuidance {}

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
  const parsed = parseCoach(content)

  if (!parsed || typeof parsed !== 'object') {
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

