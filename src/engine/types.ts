import type { Script } from '../lib/storage'

export type ConversationRole = 'agent' | 'customer' | 'assistant'

export interface ChecklistItemState {
  name: string
  done: boolean
  description?: string
}

export interface GoalState {
  name: string
  done: boolean
  description?: string
}

export type ExpectedCustomerReplyType = 'open_question' | 'yes_no' | 'narrative' | 'selection'

export interface ProposalObjection {
  detected: boolean
  category?: string
  suggestions: string[]
}

export interface Proposal {
  nextLine: string
  rationale: string
  goalsProgress: string[]
  expectedCustomerReplyType: ExpectedCustomerReplyType
  objection: ProposalObjection
  followups: string[]
  checklist: ChecklistItemState[]
  raw?: string
}

export interface ConversationTurnMetadata {
  proposal?: Proposal
  objectionCategory?: string
  resolved?: boolean
  tags?: string[]
}

export interface ConversationTurn {
  id: string
  role: ConversationRole
  text: string
  timestamp: string
  sentiment?: number | null
  metadata?: ConversationTurnMetadata
}

export interface ContextSignals {
  lastAgentSentiment: number | null
  lastCustomerSentiment: number | null
  averageSentiment: number | null
  keywords: string[]
}

export interface Persona {
  name: string
  title: string
  tone: string
  style: string
  company: string
  elevatorPitch: string
}

export interface EngineToast {
  id: string
  tone: 'info' | 'warning' | 'error'
  message: string
}

export interface ObjectionPlaybookEntry {
  category: string
  summary: string
  triggers: string[]
  counters: string[]
  followUps: string[]
}

export interface SalesPlanStage {
  id: string
  title: string
  objective: string
  cues: string[]
  checkpoint: string
}

export interface SalesPlan {
  persona: Persona
  strategy: string
  tone: string
  discoveryFramework: string[]
  productFacts: string[]
  demoHooks: string[]
  closingPlaybook: string[]
  planStages: SalesPlanStage[]
  goals: string[]
  checklist: ChecklistItemState[]
}

export interface PromptContext {
  plan: SalesPlan
  persona: Persona
  script?: Script
  goals: GoalState[]
  checklist: ChecklistItemState[]
  history: ConversationTurn[]
  contextSignals: ContextSignals
  mode?: 'default' | 'objection'
  objectionText?: string
}
