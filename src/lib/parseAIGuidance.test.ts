import { describe, expect, it } from 'vitest'
import { parseAIGuidance } from './parseAIGuidance'

describe('parseAIGuidance', () => {
  it('parses a plain JSON guidance payload string', () => {
    const response = JSON.stringify({
      guidance: {
        next_best_thing: 'Ask about their timeline',
        rationale: 'Understanding timing keeps the deal moving.',
        'follow-ups': ['Would aligning on milestones help?'],
        checklist_progress: { discovery: true }
      }
    })

    const guidance = parseAIGuidance(response)

    expect(guidance.__parsed).toBe(true)
    expect(guidance.next_best_thing).toBe('Ask about their timeline')
    expect(guidance.rationale).toBe('Understanding timing keeps the deal moving.')
    expect(guidance['follow-ups']).toEqual(['Would aligning on milestones help?'])
    expect(guidance.checklist_progress).toEqual({ discovery: true })
  })

  it('parses a double-wrapped chat completion payload', () => {
    const nestedResponse = JSON.stringify({
      id: 'chatcmpl-outer',
      object: 'chat.completion',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              id: 'chatcmpl-inner',
              object: 'chat.completion',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: JSON.stringify({
                      guidance: {
                        next_best_thing: 'Offer a trial extension',
                        rationale: 'It reduces friction while they coordinate stakeholders.',
                        followups: ['Confirm who else should review the paperwork.'],
                        checklist_progress: { trial_extended: true }
                      }
                    })
                  }
                }
              ]
            })
          }
        }
      ]
    })

    const guidance = parseAIGuidance(nestedResponse)

    expect(guidance.__parsed).toBe(true)
    expect(guidance.next_best_thing).toBe('Offer a trial extension')
    expect(guidance.rationale).toBe(
      'It reduces friction while they coordinate stakeholders.'
    )
    expect(guidance.followups).toEqual(['Confirm who else should review the paperwork.'])
    expect(guidance.checklist_progress).toEqual({ trial_extended: true })
  })

  it('falls back to raw text when parsing fails', () => {
    const plainText = 'Keep the momentum by asking when they can sign.'

    const guidance = parseAIGuidance(plainText)

    expect(guidance.__parsed).toBe(false)
    expect(guidance.next_best_thing).toBe(plainText)
    expect(guidance.rationale).toBeUndefined()
    expect(guidance['follow-ups']).toBeUndefined()
    expect(guidance.checklist_progress).toBeUndefined()
  })
})
