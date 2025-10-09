import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SentimentIntensityAnalyzer } from 'vader-sentiment'
import { saveAs } from 'file-saver'
import { createId } from '../lib/id'
import { streamChat, type ChatMessage } from '../lib/groq'
import { buildSystemPrompt, renderUserContext } from './prompt'
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
  ProposalObjection,
  SalesPlan
} from './types'
import type { Script } from '../lib/storage'

const STORAGE_NAMESPACE = 'vnote.sales.conversation'
const MAX_HISTORY_ENTRIES = 150
const MAX_PROMPT_CHARACTERS = 8000
const MAX_PROMPT_TURNS = 40
const MAX_TOTAL_TOKENS = 6000
const MIN_COMPLETION_TOKENS = 256
const MAX_COMPLETION_TOKENS = 1200
const TOKEN_SAFETY_MARGIN = 400

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

const decodeJsonString = (value: string): string => {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
}

const estimateTokens = (text: string): number => Math.ceil(text.length / 4)

const extractNextLinePreview = (buffer: string): string | null => {
  const match = buffer.match(/"next_line"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (!match) return null
  return decodeJsonString(match[1])
}

const appendEntry = (history: ConversationTurn[], entry: ConversationTurn): ConversationTurn[] => {
  const next = [...history, entry]
  if (next.length > MAX_HISTORY_ENTRIES) {
    next.splice(0, next.length - MAX_HISTORY_ENTRIES)
  }
  return next
}

const trimHistoryForPrompt = (history: ConversationTurn[]): ConversationTurn[] => {
  const reversed = [...history].reverse()
  const trimmed: ConversationTurn[] = []
  let charCount = 0
  for (const turn of reversed) {
    if (trimmed.length >= MAX_PROMPT_TURNS) break
    const length = turn.text.length
    if (charCount + length > MAX_PROMPT_CHARACTERS && trimmed.length > 0) {
      break
    }
    trimmed.push(turn)
    charCount += length
  }
  return trimmed.reverse()
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

const mapProposal = (payload: any, raw: string): Proposal => {
  const objectionPayload: ProposalObjection = {
    detected: Boolean(payload?.objection?.detected),
    category:
      typeof payload?.objection?.category === 'string' && payload.objection.category.length
        ? payload.objection.category
        : undefined,
    suggestions: Array.isArray(payload?.objection?.suggestions)
      ? payload.objection.suggestions.filter((item: unknown) => typeof item === 'string')
      : []
  }

  const checklistItems: ChecklistItemState[] = Array.isArray(payload?.checklist)
    ? payload.checklist
        .filter((item: unknown) => item && typeof item === 'object' && 'name' in (item as Record<string, unknown>))
        .map((item: any) => ({
          name: String(item.name),
          done: Boolean(item.done),
          description: item.description ? String(item.description) : undefined
        }))
    : []

  const expected =
    payload?.expected_customer_reply_type === 'yes_no' ||
    payload?.expected_customer_reply_type === 'narrative' ||
    payload?.expected_customer_reply_type === 'selection'
      ? payload.expected_customer_reply_type
      : 'open_question'

  return {
    nextLine: typeof payload?.next_line === 'string' ? payload.next_line.trim() : raw.trim(),
    rationale: typeof payload?.rationale === 'string' ? payload.rationale.trim() : '',
    goalsProgress: Array.isArray(payload?.goals_progress)
      ? payload.goals_progress.filter((item: unknown) => typeof item === 'string')
      : [],
    expectedCustomerReplyType: expected,
    objection: objectionPayload,
    followups: Array.isArray(payload?.followups)
      ? payload.followups.filter((item: unknown) => typeof item === 'string')
      : [],
    checklist: checklistItems,
    raw
  }
}

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
  const streamingBufferRef = useRef('')
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
    (role: 'agent' | 'customer', text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const sentiment = analyzeWithVader(trimmed)
      const entry: ConversationTurn = {
        id: createId(`${role}-turn`),
        role,
        text: trimmed,
        timestamp: new Date().toISOString(),
        sentiment
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
    (text: string) => {
      addUtterance('agent', text)
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
      streamingBufferRef.current = ''
      setStreamingNextLine('')

      let promptHistory = trimHistoryForPrompt(historyRef.current)
      const systemPrompt = buildSystemPrompt({
        persona,
        plan,
        script,
        objectionLibrary
      })

      let userContext = renderUserContext({
        plan,
        goals: goalsRef.current,
        checklist: checklistRef.current,
        history: promptHistory,
        contextSignals,
        mode,
        objectionText
      })

      const resolvePromptStats = () => {
        const promptTokens = estimateTokens(systemPrompt) + estimateTokens(userContext)
        const rawAvailable = MAX_TOTAL_TOKENS - promptTokens
        return {
          rawAvailable,
          availableWithMargin: rawAvailable - TOKEN_SAFETY_MARGIN
        }
      }

      let { rawAvailable, availableWithMargin } = resolvePromptStats()

      while (availableWithMargin < MIN_COMPLETION_TOKENS && promptHistory.length > 0) {
        promptHistory = promptHistory.slice(1)
        userContext = renderUserContext({
          plan,
          goals: goalsRef.current,
          checklist: checklistRef.current,
          history: promptHistory,
          contextSignals,
          mode,
          objectionText
        })
        ;({ rawAvailable, availableWithMargin } = resolvePromptStats())
      }

      let maxTokens = Math.min(
        MAX_COMPLETION_TOKENS,
        Math.max(MIN_COMPLETION_TOKENS, availableWithMargin)
      )

      if (availableWithMargin < MIN_COMPLETION_TOKENS) {
        maxTokens = Math.min(
          MAX_COMPLETION_TOKENS,
          Math.max(MIN_COMPLETION_TOKENS, rawAvailable)
        )
      }

      if (rawAvailable <= 0) {
        maxTokens = 0
      } else if (maxTokens > rawAvailable) {
        maxTokens = rawAvailable
      }

      if (maxTokens > 0 && maxTokens < 64) {
        maxTokens = Math.min(64, rawAvailable)
      }

      const completionTokens = Math.floor(Math.max(0, maxTokens))

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ]

      let responseText = ''
      try {
        responseText = await streamChat(messages, {
          json: true,
          maxTokens: completionTokens > 0 ? completionTokens : undefined,
          signal: controller.signal,
          onToken: (token) => {
            streamingBufferRef.current += token
            const preview = extractNextLinePreview(streamingBufferRef.current)
            if (preview) {
              setStreamingNextLine(preview)
            }
          }
        })
      } catch (streamError: any) {
        if (streamError?.name === 'AbortError') {
          setLoading(false)
          return proposalRef.current ?? null
        }
        setError(streamError?.message ?? 'Failed to contact assistant')
        setLoading(false)
        throw streamError
      }

      let payload: any = null
      let parsed = false
      if (responseText) {
        try {
          payload = JSON.parse(responseText)
          parsed = true
        } catch (parseError) {
          setToast({
            id: createId('toast'),
            tone: 'warning',
            message: 'AI response was not valid JSON. Showing raw suggestion.'
          })
        }
      }

      const fallbackNextLine =
        extractNextLinePreview(streamingBufferRef.current) || responseText || ''
      const rawForProposal = responseText || fallbackNextLine
      const proposal = parsed
        ? mapProposal(payload, rawForProposal)
        : mapProposal({ next_line: fallbackNextLine }, rawForProposal)
      const resolvedNextLine = proposal.nextLine.trim().length
        ? proposal.nextLine
        : fallbackNextLine.trim()
      const normalizedProposal = resolvedNextLine === proposal.nextLine
        ? proposal
        : { ...proposal, nextLine: resolvedNextLine }
      setCurrentProposal(normalizedProposal)
      proposalRef.current = normalizedProposal
      setStreamingNextLine('')

      setGoals((prev) => {
        if (!normalizedProposal.goalsProgress.length) return prev
        const accomplished = new Set(
          normalizedProposal.goalsProgress.map((item) => item.toLowerCase())
        )
        const next = prev.map((goal) =>
          accomplished.has(goal.name.toLowerCase()) ? { ...goal, done: true } : goal
        )
        goalsRef.current = next
        return next
      })

      if (normalizedProposal.checklist.length) {
        setChecklist((prev) => {
          const map = new Map<string, ChecklistItemState>()
          prev.forEach((item) => {
            map.set(item.name.toLowerCase(), { ...item })
          })
          normalizedProposal.checklist.forEach((item) => {
            const key = item.name.toLowerCase()
            const existing = map.get(key)
            if (existing) {
              map.set(key, { ...existing, done: item.done })
            } else {
              map.set(key, { ...item })
            }
          })
          const merged = Array.from(map.values())
          checklistRef.current = merged
          return merged
        })
      }

      const assistantSentiment = analyzeWithVader(normalizedProposal.nextLine)
      const assistantEntry: ConversationTurn = {
        id: createId('assistant-turn'),
        role: 'assistant',
        text: normalizedProposal.nextLine,
        timestamp: new Date().toISOString(),
        sentiment: assistantSentiment,
        metadata: {
          proposal: normalizedProposal
        }
      }

      setHistory((prev) => {
        const next = appendEntry(prev, assistantEntry)
        if (normalizedProposal.objection.detected && normalizedProposal.objection.category) {
          for (let i = next.length - 1; i >= 0; i--) {
            const turn = next[i]
            if (turn.id === assistantEntry.id) continue
            if (turn.role === 'customer') {
              const existingMeta = turn.metadata ?? {}
              next[i] = {
                ...turn,
                metadata: {
                  ...existingMeta,
                  objectionCategory: normalizedProposal.objection.category
                }
              }
              break
            }
          }
        }
        historyRef.current = next
        return next
      })

      if (assistantSentiment === null && normalizedProposal.nextLine) {
        void enhanceSentiment(assistantEntry.id, normalizedProposal.nextLine)
      }

      setLoading(false)
      return normalizedProposal
    },
    [contextSignals, enhanceSentiment, objectionLibrary, persona, plan, script]
  )

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
    handleObjection,
    reset,
    exportTranscript,
    dismissToast
  }
}
