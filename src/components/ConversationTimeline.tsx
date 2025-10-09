import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type {
  ChecklistItemState,
  ConversationTurn,
  ContextSignals,
  GoalState,
  SalesPlan
} from '../engine/types'

interface ConversationTimelineProps {
  history: ConversationTurn[]
  plan: SalesPlan
  goals: GoalState[]
  checklist: ChecklistItemState[]
  contextSignals: ContextSignals
  customerDraft: string
  onCustomerDraftChange: (value: string) => void
  onCustomerSubmit: () => Promise<void> | void
  disabled?: boolean
  onExport: () => void
}

const roleStyles: Record<ConversationTurn['role'], string> = {
  agent:
    'bg-indigo-500/90 text-white border-indigo-400/80 dark:bg-indigo-500/80 dark:border-indigo-300/40 shadow-lg shadow-indigo-500/20',
  customer:
    'bg-white/90 text-slate-700 border-slate-200/80 dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/60',
  assistant:
    'bg-emerald-50/90 text-emerald-900 border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/30'
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function summarizeStage(plan: SalesPlan, checklist: ChecklistItemState[]) {
  const total = checklist.length || 1
  const complete = checklist.filter((item) => item.done).length
  const ratio = complete / total
  const currentIndex = Math.min(plan.planStages.length - 1, Math.floor(ratio * plan.planStages.length))
  return plan.planStages.map((stage, index) => ({
    stage,
    status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'
  }))
}

export default function ConversationTimeline({
  history,
  plan,
  goals,
  checklist,
  contextSignals,
  customerDraft,
  onCustomerDraftChange,
  onCustomerSubmit,
  disabled,
  onExport
}: ConversationTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history.length])

  const progress = useMemo(() => {
    if (!checklist.length) return 0
    const complete = checklist.filter((item) => item.done).length
    return Math.round((complete / checklist.length) * 100)
  }, [checklist])

  const stageStatus = useMemo(() => summarizeStage(plan, checklist), [plan, checklist])

  const handleSubmit = async () => {
    if (!customerDraft.trim() || disabled || submitting) return
    setSubmitting(true)
    try {
      await onCustomerSubmit()
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  const keywordChips = contextSignals.keywords.slice(0, 5)

  return (
    <section className="glass-panel flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Conversation roadmap</p>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all dark:bg-indigo-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-300">{progress}% checklist</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
          >
            Export transcript
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {stageStatus.map(({ stage, status }) => (
            <span
              key={stage.id}
              className={`rounded-full px-3 py-1 font-semibold ${
                status === 'complete'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100'
                  : status === 'current'
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200'
                  : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800/60 dark:text-slate-300'
              }`}
            >
              {stage.title}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          {goals.map((goal) => (
            <span
              key={goal.name}
              className={`rounded-full border px-3 py-1 ${
                goal.done
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-100'
                  : 'border-slate-200/80 bg-white/70 text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300'
              }`}
            >
              {goal.name}
            </span>
          ))}
        </div>
        {keywordChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <span className="font-semibold">Signals:</span>
            {keywordChips.map((keyword) => (
              <span key={keyword} className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
            Waiting for the first turn. Capture what you said to start the guidance loop.
          </div>
        ) : (
          history.map((turn) => {
            const roleLabel = turn.role === 'agent' ? 'Agent' : turn.role === 'customer' ? 'Customer' : null
            const sentiment = typeof turn.sentiment === 'number' ? turn.sentiment.toFixed(2) : null
            return (
              <div key={turn.id} className={`flex ${turn.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${roleStyles[turn.role]}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                    {roleLabel && <span>{roleLabel}</span>}
                    {formatTime(turn.timestamp) && (
                      <span className="text-slate-400 dark:text-slate-300">{formatTime(turn.timestamp)}</span>
                    )}
                    {sentiment && (
                      <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-900/40 dark:text-slate-100">
                        {sentiment}
                      </span>
                    )}
                    {turn.metadata?.objectionCategory && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-100">
                        Objection: {turn.metadata.objectionCategory}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap text-[15px]">{turn.text}</div>
                  {turn.metadata?.proposal?.rationale && (
                    <p className="mt-2 rounded-2xl bg-white/50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                      {turn.metadata.proposal.rationale}
                    </p>
                  )}
                  {turn.metadata?.proposal?.followups?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-600 dark:text-indigo-200">
                      {turn.metadata.proposal.followups.slice(0, 3).map((followup, index) => (
                        <span
                          key={`${followup}-${index}`}
                          className="rounded-full bg-indigo-500/10 px-3 py-1 dark:bg-indigo-500/20"
                        >
                          {followup}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Customer reply (typed)
        </label>
        <textarea
          value={customerDraft}
          onChange={(event) => onCustomerDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type what the customer just said…"
          className="mt-2 h-24 w-full resize-none rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-sm text-slate-700 shadow-inner outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-500/30"
          disabled={disabled || submitting}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
          <span>Shift+Enter for newline</span>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="rounded-full border border-indigo-200 bg-indigo-500/90 px-4 py-1.5 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-400/40"
            disabled={disabled || submitting || !customerDraft.trim()}
          >
            Log customer reply
          </button>
        </div>
      </div>
    </section>
  )
}
