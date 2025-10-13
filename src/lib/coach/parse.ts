import type { CoachGuidance } from './schema'

export function parseCoach(content: string): CoachGuidance {
  // Try JSON first
  try {
    const obj = JSON.parse(content)
    if (obj?.agent_line) return obj as CoachGuidance
  } catch {}
  // Fallback: plain text → wrap
  return { agent_line: content, rationale: '', follow_ups: [] }
}
