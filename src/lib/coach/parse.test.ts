import { describe, expect, it } from 'vitest'
import { parseCoach } from './parse'

describe('parseCoach', () => {
  it('returns structured guidance when JSON is valid', () => {
    const payload = {
      agent_line: 'Hello there!',
      rationale: 'Friendly greeting.',
      follow_ups: ['Ask about goals']
    }
    const result = parseCoach(JSON.stringify(payload))
    expect(result).toEqual(payload)
  })

  it('maps alternative JSON shapes to CoachGuidance', () => {
    const payload = {
      next_agent_line: 'Hello there!',
      reason: 'Friendly greeting.',
      follow_up_questions: ['Ask about goals']
    }
    const result = parseCoach(JSON.stringify(payload))
    expect(result).toEqual({
      agent_line: 'Hello there!',
      rationale: 'Friendly greeting.',
      follow_ups: ['Ask about goals']
    })
  })

  it('wraps plain text responses', () => {
    const content = 'Let me know if this time still works for you.'
    const result = parseCoach(content)
    expect(result.agent_line).toBe(content)
    expect(result.rationale).toBe('')
    expect(result.follow_ups).toEqual([])
  })
})
