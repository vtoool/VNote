import type {
  ChecklistItemState,
  ConversationTurn,
  ContextSignals,
  GoalState,
  Persona,
  SalesPlan
} from './types'

const MAX_SNIPPET_LENGTH = 220

const truncate = (value: string, max: number = MAX_SNIPPET_LENGTH): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

const collectOpenNames = (items: { name: string; done: boolean }[], limit: number): string => {
  const open = items
    .filter((item) => !item.done)
    .map((item) => item.name.trim())
    .filter(Boolean)
  if (!open.length) return ''
  return open.slice(0, limit).join('; ')
}

const lastOfRole = (history: ConversationTurn[], role: ConversationTurn['role']): string | null => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index]
    if (turn.role === role) {
      const trimmed = turn.text.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }
  return null
}

const collectSnapshot = (history: ConversationTurn[], excludeLastCustomer: boolean = true): string => {
  if (history.length === 0) return ''
  const effectiveHistory =
    excludeLastCustomer && history.at(-1)?.role === 'customer' ? history.slice(0, -1) : history
  const recent = effectiveHistory.slice(-4)
  if (!recent.length) return ''
  const lines = recent.map((turn) => {
    const label = turn.role === 'agent' ? 'Agent' : 'Customer'
    return `${label}: ${truncate(turn.text, 140)}`
  })
  return lines.join('\n')
}

interface CoachContextArgs {
  persona: Persona
  plan: SalesPlan
  goals: GoalState[]
  checklist: ChecklistItemState[]
  history: ConversationTurn[]
  contextSignals: ContextSignals
  mode?: 'default' | 'objection'
  objectionText?: string
}

export function buildCoachStateContext({
  persona,
  plan,
  goals,
  checklist,
  history,
  contextSignals,
  mode,
  objectionText
}: CoachContextArgs): string {
  const pendingGoals = collectOpenNames(goals, 3)
  const pendingChecklist = collectOpenNames(checklist, 4)
  const lastAgentLine = lastOfRole(history, 'agent')
  const previousCustomer = (() => {
    const customerTurns = history.filter((turn) => turn.role === 'customer')
    if (customerTurns.length < 2) return null
    const prior = customerTurns[customerTurns.length - 2]
    return truncate(prior.text, 160)
  })()

  const keywords = contextSignals.keywords.slice(0, 4).join(', ')

  const parts: string[] = [
    `Persona: ${persona.name}, ${persona.title} at ${persona.company}. Tone: ${persona.tone}. Style: ${persona.style}.`,
    `Strategy: ${truncate(plan.strategy, 280)}`
  ]

  if (plan.discoveryFramework.length) {
    parts.push(`Discovery pillars: ${plan.discoveryFramework.slice(0, 3).join('; ')}`)
  }

  if (pendingGoals) {
    parts.push(`Open goals: ${pendingGoals}`)
  }

  if (pendingChecklist) {
    parts.push(`Checklist focus: ${pendingChecklist}`)
  }

  if (lastAgentLine) {
    parts.push(`Last agent line: ${truncate(lastAgentLine, 200)}`)
  }

  if (previousCustomer) {
    parts.push(`Previous customer context: ${previousCustomer}`)
  }

  if (keywords) {
    parts.push(`Signals: ${keywords}`)
  }

  if (mode === 'objection') {
    parts.push(`Objection focus: ${truncate(objectionText ?? 'Use the latest customer message to clarify.', 200)}`)
  }

  return parts.join('\n')
}

interface CoachUserPromptArgs {
  lastCustomerMessage: string
  history: ConversationTurn[]
  reminder?: boolean
}

export function buildCoachUserPrompt({
  lastCustomerMessage,
  history,
  reminder
}: CoachUserPromptArgs): string {
  const snapshot = collectSnapshot(history)
  const segments = [`Last customer message:\n${lastCustomerMessage.trim()}`]
  if (snapshot) {
    segments.push(`Conversation snapshot:\n${snapshot}`)
  }
  segments.push("Provide only the AGENT's next line.")
  if (reminder) {
    segments.push('REMINDER: Never write Customer lines.')
  }
  return segments.join('\n\n')
}

