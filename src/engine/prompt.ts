import type {
  ChecklistItemState,
  ConversationTurn,
  ContextSignals,
  GoalState,
  ObjectionPlaybookEntry,
  Persona,
  SalesPlan,
  SalesPlanStage
} from './types'
import type { Script } from '../lib/storage'

function formatChecklist(checklist: ChecklistItemState[]): string {
  return checklist
    .map((item) => `${item.done ? '[x]' : '[ ]'} ${item.name}${item.description ? ` — ${item.description}` : ''}`)
    .join('\n')
}

function formatGoals(goals: GoalState[]): string {
  return goals.map((goal) => `${goal.done ? '[x]' : '[ ]'} ${goal.name}`).join('\n')
}

function formatTranscript(history: ConversationTurn[]): string {
  return history
    .map((turn) => {
      const timestamp = new Date(turn.timestamp)
      const time = Number.isNaN(timestamp.getTime())
        ? ''
        : `(${timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })})`
      const sentiment = typeof turn.sentiment === 'number' ? ` sentiment=${turn.sentiment.toFixed(2)}` : ''
      const label = turn.role.toUpperCase()
      return `${label} ${time}${sentiment}: ${turn.text}`
    })
    .join('\n')
}

function describePlanStages(planStages: SalesPlanStage[], checklist: ChecklistItemState[]): string {
  if (planStages.length === 0) return 'No plan stages provided.'
  const total = checklist.length || 1
  const completed = checklist.filter((item) => item.done).length
  const progressRatio = completed / total
  const currentIndex = Math.min(planStages.length - 1, Math.floor(progressRatio * planStages.length))

  return planStages
    .map((stage, index) => {
      const status = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
      return `${index + 1}. ${stage.title} — status: ${status}. Objective: ${stage.objective}. Key cues: ${stage.cues.join(
        '; '
      )}. Checkpoint: ${stage.checkpoint}`
    })
    .join('\n')
}

function describeScript(script?: Script): string {
  if (!script) return 'Script not provided. Use plan + discovery framework as guidance.'
  const sections = script.sections
    .map((section) => {
      const questions = section.questions
        .map((question) => {
          const variants = question.variants.map((variant) => `• ${variant.text} (${variant.tone})`).join('\n')
          const tags = question.tags.length ? `Tags: ${question.tags.join(', ')}` : ''
          return `- ${question.label}${tags ? ` — ${tags}` : ''}${variants ? `\n${variants}` : ''}`
        })
        .join('\n')
      return `${section.title}: ${section.cues}\n${questions}`
    })
    .join('\n\n')
  return sections
}

function describeObjections(objections: ObjectionPlaybookEntry[]): string {
  return objections
    .map((objection) => {
      return `${objection.category.toUpperCase()}: ${objection.summary}\nTriggers: ${objection.triggers.join(
        ', '
      )}\nCounters: ${objection.counters.join(' | ')}\nFollow-ups: ${objection.followUps.join(' | ')}`
    })
    .join('\n\n')
}

function summarizeSignals(signals: ContextSignals): string {
  const agentSentiment =
    typeof signals.lastAgentSentiment === 'number'
      ? signals.lastAgentSentiment.toFixed(2)
      : 'n/a'
  const customerSentiment =
    typeof signals.lastCustomerSentiment === 'number'
      ? signals.lastCustomerSentiment.toFixed(2)
      : 'n/a'
  const average =
    typeof signals.averageSentiment === 'number' ? signals.averageSentiment.toFixed(2) : 'n/a'
  const keywords = signals.keywords.length ? signals.keywords.join(', ') : 'none observed'
  return `Agent sentiment: ${agentSentiment}. Customer sentiment: ${customerSentiment}. Rolling average: ${average}. Keywords: ${keywords}.`
}

export function buildSystemPrompt({
  persona,
  plan,
  script,
  objectionLibrary
}: {
  persona: Persona
  plan: SalesPlan
  script?: Script
  objectionLibrary: ObjectionPlaybookEntry[]
}): string {
  const scriptDescription = describeScript(script)
  const objectionsDescription = describeObjections(objectionLibrary)
  return `You are ${persona.name}, ${persona.title} for ${persona.company}. Your tone is ${persona.tone} and your style is ${persona.style}. ${persona.elevatorPitch}

Sales strategy: ${plan.strategy}
Discovery framework pillars: ${plan.discoveryFramework.join(', ')}
Product facts: ${plan.productFacts.join(' | ')}
Demo hooks: ${plan.demoHooks.join(' | ')}
Closing playbook: ${plan.closingPlaybook.join(' | ')}

Guided script outline:
${scriptDescription}

Objection playbook:
${objectionsDescription}

Always respond in valid JSON with the schema provided. Keep guidance concise, actionable, and conversational. Adapt to real-time sentiment and stay aligned to the plan.`
}

export function renderUserContext({
  plan,
  goals,
  checklist,
  history,
  contextSignals,
  mode = 'default',
  objectionText
}: {
  plan: SalesPlan
  goals: GoalState[]
  checklist: ChecklistItemState[]
  history: ConversationTurn[]
  contextSignals: ContextSignals
  mode?: 'default' | 'objection'
  objectionText?: string
}): string {
  const transcript = formatTranscript(history)
  const goalsText = formatGoals(goals)
  const checklistText = formatChecklist(checklist)
  const planStagesText = describePlanStages(plan.planStages, checklist)
  const signals = summarizeSignals(contextSignals)

  const modeDirective =
    mode === 'objection'
      ? `An objection is being handled. Focus on resolving it with empathy. Objection context: ${objectionText ??
          'Use the last customer turn to infer objection.'}`
      : 'Provide the next best thing for the agent to say and keep momentum.'

  return `Conversation transcript (most recent last):
${transcript || '(no conversation yet)'}

Goals progress:
${goalsText || '(no goals)'}

Checklist state:
${checklistText || '(no checklist)'}

Plan roadmap status:
${planStagesText}

Local signals:
${signals}

Mode: ${mode}. ${modeDirective}

When giving guidance include rationale, a crisp next line, suggested follow-ups, and update goal/checklist progress.`
}
