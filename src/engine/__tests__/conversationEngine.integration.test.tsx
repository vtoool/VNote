import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConversationEngine } from '../useConversationEngine'

const suggestion = {
  agent_line: 'Thanks for sharing that. May I ask what success looks like for you next quarter?',
  rationale: 'Invites discovery while acknowledging the customer.',
  follow_ups: ['Confirm stakeholders', 'Ask about current tools']
}

const mockChatResponse = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: JSON.stringify(suggestion)
      }
    }
  ]
}

describe('conversation engine integration', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_URL', 'https://example.com')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockChatResponse,
      headers: new Headers()
    } as Response)
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('surfaces coach guidance without adding a customer bubble', async () => {
    const { result } = renderHook(() =>
      useConversationEngine({
        projectId: 'integration-test'
      })
    )

    await act(async () => {
      result.current.addCustomerUtterance('Hello there, I am curious about VNote.')
      await result.current.proposeNext()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"gemini-2.0-flash"'),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    )

    const proposal = result.current.currentProposal
    expect(proposal?.nextLine).toContain('Thanks for sharing')
    expect(proposal?.followups).toEqual(suggestion.follow_ups)

    const customerTurns = result.current.history.filter((turn) => turn.role === 'customer')
    expect(customerTurns).toHaveLength(1)
    expect(customerTurns[0]?.text).toContain('curious about VNote')

    const agentEcho = result.current.history.find((turn) =>
      turn.role === 'customer' && turn.text.includes('Thanks for sharing')
    )
    expect(agentEcho).toBeUndefined()
  })
})
