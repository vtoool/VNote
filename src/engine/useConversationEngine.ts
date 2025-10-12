import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SentimentIntensityAnalyzer } from 'vader-sentiment'
import { saveAs } from 'file-saver'
import { createId } from '../lib/id'
import { streamChat } from '../lib/groq'
import {
  buildCoachStateContext,
  buildCoachUserPrompt
} from './prompt'
import {
  SALES_COACH_SYSTEM,
  COACH_RESPONSE_FORMAT,
  COACH_STOP_SEQUENCES,
  processCoachResponse,
  CoachSuggestionError,
  buildCoachMessages,
  type ProcessedCoachSuggestion
} from './coach'
import { SALES_PLAN } from '../knowledge/plan'
import { OBJECTION_LIBRARY } from '../knowledge/objections'
import type {
  ChecklistItemState,
  ConversationTurn,
  ContextSignals,
  EngineToast,
  GoalState,
  ObjectionPlaybookEntry,
  Persona,
  Proposal,
  SalesPlan
} from './types'
import type { Script } from '../lib/storage'

const STORAGE_NAMESPACE = 'vnote.sales.conversation'
const MAX_HISTORY_ENTRIES = 150
const COACH_COMPLETION_TOKENS = 220

export const getConversationStorageKey = (projectId?: string): string =>
  projectId ? `${STORAGE_NAMESPACE}.${projectId}` : STORAGE_NAMESPACE

const STOP_WORDS = new Set([
  'the',
  'and',
  'that',
  'with',
  'this',
  'have',
  'from',
  'your',
  'about',
  'into',
  'their',
  'while',
  'there',
  'would',
  'could',
  'should',
  'been',
  'will',
  'they',
  'just',
  'really',
  'maybe',
  'where',
  'when',
  'what',
  'which',
  'ever',
  'some',
  'have',
  'need',
  'take',
  'then',
  'than',
  'here',
  'have',
  'that',
  'them',
  'been'
])

interface StoredState {
  history: ConversationTurn[]
  goals: GoalState[]
  checklist: ChecklistItemState[]
  persona: Persona
  currentProposal?: Proposal | null
}

interface UseConversationEngineOptions {
  script?: Script
  personaName?: string
  plan?: SalesPlan
  objectionLibrary?: ObjectionPlaybookEntry[]
  projectId?: string
}

interface ExportPayload {
  version: string
  generatedAt: string
  persona: Persona
  plan: SalesPlan
  goals: GoalState[]
  checklist: ChecklistItemState[]
  history: ConversationTurn[]
}

const appendEntry = (history: ConversationTurn[], entry: ConversationTurn): ConversationTurn[] => {
  const next = [...history, entry]
  if (next.length > MAX_HISTORY_ENTRIES) {
    next.splice(0, next.length - MAX_HISTORY_ENTRIES)
  }
  return next
}

const analyzeWithVader = (text: string): number | null => {
  if (!text.trim()) return null
  const scores = SentimentIntensityAnalyzer.polarity_scores(text)
  if (!scores) return null
  return Number(scores.compound.toFixed(4))
}

const computeContextSignals = (history: ConversationTurn[]): ContextSignals => {
  const agentSentiments = history
    .filter((turn) => turn.role === 'agent' && typeof turn.sentiment === 'number')
    .map((turn) => turn.sentiment as number)
  const customerSentiments = history
    .filter((turn) => turn.role === 'customer' && typeof turn.sentiment === 'number')
    .map((turn) => turn.sentiment as number)
  const combined = [...agentSentiments, ...customerSentiments]
  const average = combined.length ? combined.reduce((sum, value) => sum + value, 0) / combined.length : null

  const recent = history.slice(-8)
  const text = recent.map((turn) => turn.text).join(' ').toLowerCase()
  const tokens = text.match(/[a-z][a-z'\-]{3,}/g) ?? []
  const counts = new Map<string, number>()
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }
  const keywords = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word)

  return {
    lastAgentSentiment: agentSentiments.at(-1) ?? null,
    lastCustomerSentiment: customerSentiments.at(-1) ?? null,
    averageSentiment: average,
    keywords
  }
}

const isRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function useConversationEngine({
  script: externalScript,
  personaName,
  plan: planOverride,
  objectionLibrary: objectionOverride,
  projectId
}: UseConversationEngineOptions = {}) {
  const plan = useMemo(() => planOverride ?? SALES_PLAN, [planOverride])
  const baseGoals = useMemo(
    () => plan.goals.map((goal) => ({ name: goal, done: false } as GoalState)),
    [plan]
  )
  const baseChecklist = useMemo(
    () => plan.checklist.map((item) => ({ ...item })),
    [plan]
  )
  const objectionLibrary = useMemo(
    () => objectionOverride ?? OBJECTION_LIBRARY,
    [objectionOverride]
  )

  const storageKey = useMemo(() => getConversationStorageKey(projectId), [projectId])

  const [history, setHistory] = useState<ConversationTurn[]>([])
  const [goals, setGoals] = useState<GoalState[]>(() => baseGoals.map((goal) => ({ ...goal })))
  const [checklist, setChecklist] = useState<ChecklistItemState[]>(() =>
    baseChecklist.map((item) => ({ ...item }))
  )
  const [persona, setPersona] = useState<Persona>(() => {
    const base = plan.persona
    return { ...base, name: personaName ?? base.name }
  })
  const [script, setScript] = useState<Script | undefined>(() => externalScript)
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<EngineToast | null>(null)
  const [streamingNextLine, setStreamingNextLine] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  const historyRef = useRef<ConversationTurn[]>([])
  const goalsRef = useRef<GoalState[]>(baseGoals.map((goal) => ({ ...goal })))
  const checklistRef = useRef<ChecklistItemState[]>(baseChecklist.map((item) => ({ ...item })))
  const proposalRef = useRef<Proposal | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastCustomerTextRef = useRef<string>('')

  const advancedSentimentEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false
    const nav = window.navigator as Navigator & { gpu?: unknown }
    return Boolean(nav.gpu) && import.meta.env.VITE_ENABLE_GPU_SENTIMENT === 'true'
  }, [])
  const pipelinePromiseRef = useRef<Promise<any> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsInitialized(false)
    let parsed: StoredState | null = null
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const candidate = JSON.parse(raw) as StoredState
        if (candidate && typeof candidate === 'object') {
          parsed = candidate
        }
      }
    } catch (error) {
      console.warn('Failed to parse stored conversation state', error)
    }

    const nextHistory = parsed?.history ?? []
    const nextGoals = parsed?.goals?.map((goal) => ({ ...goal })) ?? baseGoals.map((goal) => ({ ...goal }))
    const nextChecklist =
      parsed?.checklist?.map((item) => ({ ...item })) ?? baseChecklist.map((item) => ({ ...item }))
    const personaBase = parsed?.persona ?? plan.persona
    const nextPersona = { ...personaBase, name: personaName ?? personaBase.name }
    const nextProposal = parsed?.currentProposal ?? null

    setHistory(nextHistory)
    historyRef.current = nextHistory
    setGoals(nextGoals)
    goalsRef.current = nextGoals
    setChecklist(nextChecklist)
    checklistRef.current = nextChecklist
    setPersona(nextPersona)
    setCurrentProposal(nextProposal)
    proposalRef.current = nextProposal
    setStreamingNextLine('')
    setError(null)
    setToast(null)
    setLoading(false)
    setIsInitialized(true)
  }, [storageKey, baseGoals, baseChecklist, personaName, plan.persona])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    goalsRef.current = goals
  }, [goals])

  useEffect(() => {
    checklistRef.current = checklist
  }, [checklist])

  useEffect(() => {
    proposalRef.current = currentProposal
  }, [currentProposal])

  useEffect(() => {
    setPersona((prev) => ({ ...prev, name: personaName ?? plan.persona.name }))
  }, [personaName, plan.persona.name])

  useEffect(() => {
    setScript(externalScript)
  }, [externalScript])

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return
    const payload: StoredState = {
      history,
      goals,
      checklist,
      persona,
      currentProposal: proposalRef.current
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (error) {
      console.warn('Failed to persist conversation state', error)
    }
  }, [history, goals, checklist, persona, storageKey, isInitialized, currentProposal])

  const ensurePipeline = useCallback(async () => {
    if (!advancedSentimentEnabled) return null
    if (!pipelinePromiseRef.current) {
      pipelinePromiseRef.current = import('@xenova/transformers').then(async ({ pipeline }) => {
        const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')
        return classifier
      })
    }
    return pipelinePromiseRef.current
  }, [advancedSentimentEnabled])

  const enhanceSentiment = useCallback(
    async (entryId: string, text: string) => {
      if (!advancedSentimentEnabled || text.length < 12) return
      try {
        const pipeline = await ensurePipeline()
        if (!pipeline) return
        const output = await pipeline(text)
        const result = Array.isArray(output) ? output[0] : output
        if (!result) return
        const label = String(result.label ?? '').toLowerCase()
        const score = Number(result.score ?? 0)
        if (!Number.isFinite(score)) return
        const normalized = label.includes('neg') ? -score : label.includes('pos') ? score : 0
        setHistory((prev) =>
          prev.map((turn) =>
            turn.id === entryId ? { ...turn, sentiment: Number(normalized.toFixed(4)) } : turn
          )
        )
      } catch (pipelineError) {
        console.warn('Advanced sentiment failed', pipelineError)
      }
    },
    [advancedSentimentEnabled, ensurePipeline]
  )

  const contextSignals = useMemo(() => computeContextSignals(history), [history])

  const addUtterance = useCallback(
    (role: 'agent' | 'customer', text: string, metadata?: ConversationTurn['metadata']) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const sentiment = analyzeWithVader(trimmed)
      const entry: ConversationTurn = {
        id: createId(`${role}-turn`),
        role,
        text: trimmed,
        timestamp: new Date().toISOString(),
        sentiment,
        metadata
      }
      setHistory((prev) => {
        const next = appendEntry(prev, entry)
        historyRef.current = next
        return next
      })
      if (role === 'customer') {
        lastCustomerTextRef.current = trimmed
      }
      if (sentiment === null) {
        void enhanceSentiment(entry.id, trimmed)
      } else if (advancedSentimentEnabled) {
        void enhanceSentiment(entry.id, trimmed)
      }
    },
    [advancedSentimentEnabled, enhanceSentiment]
  )

  const addAgentUtterance = useCallback(
    (text: string, metadata?: ConversationTurn['metadata']) => {
      addUtterance('agent', text, metadata)
    },
    [addUtterance]
  )

  const addCustomerUtterance = useCallback(
    (text: string) => {
      addUtterance('customer', text)
    },
    [addUtterance]
  )

  const dismissToast = useCallback(() => setToast(null), [])

  const reset = useCallback(() => {
    setHistory([])
    historyRef.current = []
    const resetGoals = baseGoals.map((goal) => ({ ...goal }))
    const resetChecklist = baseChecklist.map((item) => ({ ...item }))
    setGoals(resetGoals)
    goalsRef.current = resetGoals
    setChecklist(resetChecklist)
    checklistRef.current = resetChecklist
    const resetPersona = { ...plan.persona, name: personaName ?? plan.persona.name }
    setPersona(resetPersona)
    setCurrentProposal(null)
    proposalRef.current = null
    setStreamingNextLine('')
    setError(null)
    setToast(null)
    setLoading(false)
    lastCustomerTextRef.current = ''
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey)
      } catch (storageError) {
        console.warn('Failed to clear conversation state', storageError)
      }
    }
  }, [baseGoals, baseChecklist, personaName, plan.persona, storageKey])

  const exportTranscript = useCallback(() => {
    const payload: ExportPayload = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      persona,
      plan,
      goals: goalsRef.current,
      checklist: checklistRef.current,
      history: historyRef.current
    }
    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    try {
      saveAs(jsonBlob, `vnote-conversation-${stamp}.json`)
    } catch (error) {
      console.warn('Failed to save JSON transcript', error)
    }

    const markdownLines = [
      '# VNote Conversation Transcript',
      `Generated: ${payload.generatedAt}`,
      `Persona: ${persona.name} — ${persona.title}`,
      '',
      '## Goals',
      ...payload.goals.map((goal) => `- ${goal.done ? '[x]' : '[ ]'} ${goal.name}`),
      '',
      '## Checklist',
      ...payload.checklist.map((item) => `- ${item.done ? '[x]' : '[ ]'} ${item.name}`),
      '',
      '## Conversation'
    ]
    payload.history.forEach((turn) => {
      const time = new Date(turn.timestamp).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
      const role = turn.role === 'assistant' ? 'Assistant (Next best line)' : turn.role === 'agent' ? 'Agent' : 'Customer'
      markdownLines.push(`**${role} ${time ? `(${time})` : ''}:**`)
      markdownLines.push(turn.text)
      markdownLines.push('')
    })
    const markdownBlob = new Blob([markdownLines.join('\n')], { type: 'text/markdown' })
    try {
      saveAs(markdownBlob, `vnote-conversation-${stamp}.md`)
    } catch (error) {
      console.warn('Failed to save Markdown transcript', error)
    }
  }, [persona, plan])

  const proposeNext = useCallback(
    async ({ mode = 'default', objectionText }: { mode?: 'default' | 'objection'; objectionText?: string } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      setLoading(true)
      setError(null)
      setToast(null)
      setStreamingNextLine('')

      const lastCustomer = (objectionText ?? '').trim() || lastCustomerTextRef.current.trim()
      if (!lastCustomer) {
        setLoading(false)
        setError('Log the latest customer message to get coaching.')
        return null
      }

      const contextPrompt = buildCoachStateContext({
        persona,
        plan,
        goals: goalsRef.current,
        checklist: checklistRef.current,
        history: historyRef.current,
        contextSignals,
        mode,
        objectionText
      })

      const sendRequest = async (reminder: boolean) => {
        const userPrompt = buildCoachUserPrompt({
          lastCustomerMessage: lastCustomer,
          history: historyRef.current,
          reminder
        })
        const messages = buildCoachMessages(SALES_COACH_SYSTEM, contextPrompt, userPrompt)
        return streamChat(messages, {
          model: 'llama-3.1-8b-instant',
          temperature: 0.3,
          maxTokens: COACH_COMPLETION_TOKENS,
          signal: controller.signal,
          stream: false,
          stop: Array.from(COACH_STOP_SEQUENCES),
          responseFormat: COACH_RESPONSE_FORMAT
        })
      }

      let attempts = 0
      let reminder = false
      let toastIssued = false
      let processedSuggestion: ProcessedCoachSuggestion | null = null
      let rawContent = ''
      let lastError: unknown = null

      while (attempts < 2) {
        attempts += 1
        try {
          rawContent = await sendRequest(reminder)
          const trimmed = rawContent.trim()
          if (!trimmed) {
            throw new CoachSuggestionError('Coach returned an empty response', 'missing_agent_line')
          }

          const processed = processCoachResponse(trimmed)
          if (processed.requiresReminder && !reminder) {
            reminder = true
            continue
          }
          if (processed.requiresReminder && reminder) {
            throw new CoachSuggestionError('Coach attempted to role-play the customer', 'customer_roleplay')
          }

          processedSuggestion = processed
          break
        } catch (error: any) {
          if (error?.name === 'AbortError') {
            setLoading(false)
            return proposalRef.current ?? null
          }

          if (error instanceof CoachSuggestionError) {
            if ((error.code === 'invalid_json' || error.code === 'missing_agent_line') && attempts < 2) {
              if (!toastIssued) {
                setToast({
                  id: createId('coach-retry'),
                  tone: 'warning',
                  message: 'Coach is thinking—please try again'
                })
                toastIssued = true
              }
              continue
            }
            lastError = error
            break
          }

          lastError = error
          break
        }
      }

      abortControllerRef.current = null

      if (!processedSuggestion) {
        const message = lastError instanceof Error ? lastError.message : 'Coach unavailable. Please try again.'
        setError(message)
        setLoading(false)
        return null
      }

      const suggestion = processedSuggestion.suggestion
      const proposal: Proposal = {
        nextLine: suggestion.agent_line,
        rationale: suggestion.rationale,
        goalsProgress: [],
        expectedCustomerReplyType: undefined,
        objection: { detected: false, suggestions: [] },
        followups: suggestion.follow_ups,
        checklist: [],
        raw: rawContent
      }

      setCurrentProposal(proposal)
      proposalRef.current = proposal
      setStreamingNextLine('')
      setLoading(false)
      return proposal
    },
    [contextSignals, persona, plan]
  )

  const insertCoachSuggestion = useCallback(() => {
    const proposal = proposalRef.current
    if (!proposal) return null
    const trimmed = proposal.nextLine.trim()
    if (!trimmed) return null
    addAgentUtterance(trimmed, { proposal })
    setCurrentProposal(null)
    proposalRef.current = null
    setStreamingNextLine('')
    return trimmed
  }, [addAgentUtterance])

  const handleObjection = useCallback(
    async (text?: string) => {
      const objectionContext = text?.trim() || lastCustomerTextRef.current || undefined
      return proposeNext({ mode: 'objection', objectionText: objectionContext })
    },
    [proposeNext]
  )

  return {
    plan,
    script,
    persona,
    goals,
    checklist,
    history,
    contextSignals,
    currentProposal,
    streamingNextLine,
    loading,
    error,
    toast,
    objectionLibrary,
    addAgentUtterance,
    addCustomerUtterance,
    proposeNext,
    insertCoachSuggestion,
    handleObjection,
    reset,
    exportTranscript,
    dismissToast
  }
}
