import { describe, expect, it } from 'vitest'
import { processCoachResponse, sanitizeAgentLine } from '../coach'

const countSentences = (value: string): number => {
  const matches = value.match(/[^.!?]+[.!?]?/g)
  if (!matches) return value.trim() ? 1 : 0
  return matches.map((sentence) => sentence.trim()).filter(Boolean).length
}

describe('coach response processing', () => {
  const scenarios = [
    {
      name: 'greeting',
      agentLine:
        'Appreciate the warm hello! Before we jump in, may I ask what prompted you to explore VNote today? It helps me tailor the conversation to your goals. I will keep it brief.',
      rationale: 'Keep rapport while steering to discovery.',
      followUps: ['Ask about their current workflow', 'Confirm what success looks like']
    },
    {
      name: 'objection',
      agentLine:
        'Totally hear the concern about timing. Would it help if we mapped how the rollout could happen in phases? That way you can tackle quick wins first. Let’s keep the pressure low.',
      rationale: 'Address the objection with a phased option.',
      followUps: ['Offer a phased adoption outline', 'Ask who else should weigh in']
    },
    {
      name: 'pricing push',
      agentLine:
        'Thanks for being direct on pricing. Can I walk you through how teams recoup the investment in under a quarter and tailor the package to what you actually use? It will make the numbers real. That context helps a lot.',
      rationale: 'Reframe pricing with ROI context.',
      followUps: ['Share a quick ROI example', 'Confirm budget guardrails']
    }
  ]

  scenarios.forEach(({ name, agentLine, rationale, followUps }) => {
    it(`sanitizes agent line for ${name} scenario`, () => {
      const payload = {
        agent_line: agentLine,
        rationale,
        follow_ups: followUps
      }
      const response = processCoachResponse(JSON.stringify(payload))
      expect(response.requiresReminder).toBe(false)
      expect(response.suggestion.agent_line).not.toMatch(/Customer:/i)
      expect(countSentences(response.suggestion.agent_line)).toBeLessThanOrEqual(2)
    })
  })

  it('flags customer role-play attempts', () => {
    const payload = {
      agent_line: 'Customer: I really love this part. You should respond to me now.',
      rationale: 'Demonstrate guardrail enforcement.',
      follow_ups: ['Thank them for the feedback']
    }
    const result = processCoachResponse(JSON.stringify(payload))
    expect(result.requiresReminder).toBe(true)
  })

  it('limits ad-hoc sanitization to two sentences', () => {
    const longLine =
      'Here is a first sentence with energy! Here comes the second sentence with a question? This third sentence should be trimmed away entirely.'
    const sanitized = sanitizeAgentLine(longLine)
    expect(countSentences(sanitized)).toBeLessThanOrEqual(2)
    expect(sanitized).not.toContain('third sentence')
  })
})

