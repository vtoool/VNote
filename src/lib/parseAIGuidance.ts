import type { ChatMessage } from './chatClient'

export type Guidance = {
  next_best_thing: string
  rationale?: string
  'follow-ups'?: string[]
  followups?: string[]
  checklist_progress?: Record<string, number | boolean>
}

export interface ParsedGuidance extends Guidance {
  __parsed: boolean
  __raw: string
  __source?: unknown
}

const looksJsonLike = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return false
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractContent = (value: unknown): unknown => {
  if (typeof value === 'string') return value
  if (!isRecord(value)) return undefined

  if (Array.isArray(value.choices) && value.choices.length > 0) {
    const message = value.choices[0]?.message as ChatMessage | undefined
    if (isRecord(message) && typeof message.content === 'string') {
      return message.content
    }
  }

  if (isRecord(value.message) && typeof value.message.content === 'string') {
    return value.message.content
  }

  if (typeof value.content === 'string') {
    return value.content
  }

  return undefined
}

const toStringArray = (value: unknown): string[] | undefined => {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const results = value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    return results.length ? results : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : undefined
  }
  return undefined
}

const toChecklistProgress = (value: unknown): Record<string, number | boolean> | undefined => {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value).reduce<Record<string, number | boolean>>((acc, [key, status]) => {
    if (typeof status === 'number' || typeof status === 'boolean') {
      acc[key] = status
    }
    return acc
  }, {})
  return Object.keys(entries).length ? entries : undefined
}

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }
  return undefined
}

const pickBestNextThing = (value: Record<string, unknown>): string | undefined => {
  const direct = pickString(
    value.next_best_thing,
    value.nextBestThing,
    value.next_line,
    value.nextLine,
    value.best_next_line,
    value.bestNextLine,
    value.line,
    value.text,
    value.message
  )
  if (direct) return direct

  const bestNext = [value.best_next_thing, value.bestNextThing, value.actions, value.guidance]
    .map((candidate) => (isRecord(candidate) ? candidate : null))
    .filter((candidate): candidate is Record<string, unknown> => Boolean(candidate))

  for (const candidate of bestNext) {
    const nested = pickBestNextThing(candidate)
    if (nested) return nested
  }

  return undefined
}

export function parseAIGuidance(response: unknown): ParsedGuidance {
  let current: unknown = response
  let raw = typeof response === 'string' ? response : ''
  let parsed = false
  let structured = false
  let safety = 0

  const advance = (value: unknown) => {
    const extracted = extractContent(value)
    if (typeof extracted === 'string') {
      raw = extracted
      return extracted
    }
    return extracted
  }

  let next = advance(current)
  if (next !== undefined) {
    current = next
  }

  while (safety < 4) {
    safety += 1
    if (typeof current === 'string') {
      raw = current
      if (looksJsonLike(current)) {
        try {
          current = JSON.parse(current)
          parsed = true
          const extracted = advance(current)
          if (extracted !== undefined && extracted !== current) {
            current = extracted
            continue
          }
        } catch {
          // fall through to use raw text
        }
      }
      break
    }

    if (isRecord(current) && isRecord(current.guidance)) {
      current = current.guidance
      structured = true
      break
    }

    if (isRecord(current)) {
      const extracted = advance(current)
      if (extracted !== undefined && extracted !== current) {
        current = extracted
        continue
      }
      break
    }

    break
  }

  let guidanceData: Record<string, unknown> | null = null
  let innerGuidance: Record<string, unknown> | null = null
  if (isRecord(current)) {
    guidanceData = current
    innerGuidance = isRecord(current.guidance) ? current.guidance : current
    if (isRecord(current.guidance)) {
      structured = true
    }
  }

  let nextBestThing = ''
  let rationale: string | undefined
  let followUps: string[] | undefined
  let checklist: Record<string, number | boolean> | undefined

  const guidanceSource = innerGuidance ?? guidanceData

  if (guidanceSource) {
    const best = pickBestNextThing(guidanceSource)
    if (typeof best === 'string') {
      nextBestThing = best
      structured = true
    }

    const rationaleCandidate = pickString(
      guidanceSource.rationale,
      guidanceSource.reason,
      guidanceSource.reasoning,
      guidanceSource.explanation,
      guidanceSource.context,
      guidanceSource.why
    )
    if (rationaleCandidate) {
      rationale = rationaleCandidate
      structured = true
    }

    const followupCandidate =
      toStringArray(guidanceSource['follow-ups']) ??
      toStringArray((guidanceSource as Record<string, unknown>).followups) ??
      toStringArray(guidanceSource.follow_ups) ??
      toStringArray(guidanceSource.followUps)
    if (followupCandidate) {
      followUps = followupCandidate
      structured = true
    }

    const checklistCandidate =
      toChecklistProgress(guidanceSource.checklist_progress) ??
      toChecklistProgress(guidanceSource.checklistProgress) ??
      toChecklistProgress(guidanceSource.checklist)
    if (checklistCandidate) {
      checklist = checklistCandidate
      structured = true
    }
  }

  if (!nextBestThing) {
    nextBestThing = raw
  }

  const result: ParsedGuidance = {
    next_best_thing: nextBestThing,
    ...(rationale ? { rationale } : {}),
    ...(followUps ? { 'follow-ups': followUps, followups: followUps } : {}),
    ...(checklist ? { checklist_progress: checklist } : {}),
    __parsed: structured,
    __raw: raw,
    __source: guidanceSource ?? guidanceData ?? current
  }

  return result
}
