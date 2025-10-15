import type { CoachGuidance } from './schema'

const pickString = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }
  return undefined
}

const toStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
    return items.length ? items : undefined
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return undefined
}

export function parseCoach(content: string): CoachGuidance {
  // Try JSON first
  try {
    const obj = JSON.parse(content)
    if (obj && typeof obj === 'object') {
      const record = obj as Record<string, unknown>
      const agentLine = pickString(
        record.agent_line,
        record.next_agent_line,
        record.agentLine,
        record.nextAgentLine,
        record.next_line,
        record.nextLine,
        record.suggestion,
        record.response
      )

      if (agentLine) {
        const rationale =
          pickString(
            record.rationale,
            record.reason,
            record.reasoning,
            record.explanation,
            record.context,
            record.why
          ) ?? ''

        const followUps =
          toStringArray(record.follow_ups) ??
          toStringArray(record.followUps) ??
          toStringArray(record['follow-ups']) ??
          toStringArray(record.follow_up_questions) ??
          toStringArray(record.followUpQuestions) ??
          []

        return {
          agent_line: agentLine,
          rationale,
          follow_ups: followUps
        }
      }
    }
  } catch {}
  // Fallback: plain text → wrap
  return { agent_line: content, rationale: '', follow_ups: [] }
}
