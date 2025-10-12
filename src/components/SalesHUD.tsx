import { useMemo } from 'react'
import type { Proposal } from '../engine/types'

interface SalesHUDProps {
  proposal: Proposal | null
  streamingNextLine?: string
  loading?: boolean
  sentiment?: number | null
  onCopy?: (text: string) => void
  onHandleObjection?: () => void
  error?: string | null
  onInsert?: () => void
}

const sentimentColor = (sentiment?: number | null) => {
  if (typeof sentiment !== 'number') return 'bg-slate-300'
  if (sentiment >= 0.25) return 'bg-emerald-500'
  if (sentiment <= -0.2) return 'bg-rose-500'
  return 'bg-amber-400'
}

const sentimentLabel = (sentiment?: number | null) => {
  if (typeof sentiment !== 'number') return 'neutral'
  if (sentiment >= 0.25) return 'positive'
  if (sentiment <= -0.2) return 'challenged'
  return 'uncertain'
}

export function SalesHUD({
  proposal,
  streamingNextLine,
  loading,
  sentiment,
  onCopy,
  onHandleObjection,
  error,
  onInsert
}: SalesHUDProps) {
  const trimmedError = error?.trim() ?? ''
  const nextLine = streamingNextLine?.trim().length
    ? streamingNextLine.trim()
    : proposal?.nextLine?.trim() ?? ''
  const formattedError = trimmedError.length > 220 ? `${trimmedError.slice(0, 219)}…` : trimmedError
  const fallbackMessage = 'Log the latest customer message to receive a coach suggestion.'
  const displayLine = trimmedError
    ? `Coach unavailable: ${formattedError}`
    : nextLine || fallbackMessage
  const hasSuggestion = Boolean(nextLine)

  const followUps = useMemo(() => {
    if (!proposal) return [] as string[]
    return proposal.followups.map((item) => item.trim()).filter(Boolean).slice(0, 3)
  }, [proposal])

  const handleCopy = () => {
    if (!hasSuggestion) return
    onCopy?.(nextLine)
  }

  const handleInsert = () => {
    if (!hasSuggestion || loading) return
    onInsert?.()
  }

  return (
    <section className="glass-panel space-y-4 p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Coach suggestion</p>
          <div className="text-2xl font-semibold leading-snug text-slate-800 dark:text-slate-100">
            {loading ? (
              <span className="animate-pulse text-base font-medium text-slate-500 dark:text-slate-400">
                Coach is drafting…
              </span>
            ) : (
              <span
                className={
                  trimmedError
                    ? 'text-base font-medium text-rose-600 dark:text-rose-400'
                    : undefined
                }
              >
                {displayLine}
              </span>
            )}
          </div>
          {proposal?.rationale && (
            <p className="text-sm text-slate-600 dark:text-slate-300">{proposal.rationale}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={handleInsert}
            className="rounded-full border border-indigo-200 bg-indigo-500/90 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-400/60"
            disabled={!hasSuggestion || loading}
          >
            Insert as Agent
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200"
            disabled={!hasSuggestion}
          >
            Copy line
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className={`inline-flex h-3 w-3 rounded-full ${sentimentColor(sentiment)}`} aria-hidden="true" />
            <span>{sentimentLabel(sentiment)} sentiment</span>
          </div>
        </div>
      </header>

      {followUps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Follow-up options</p>
          <div className="flex flex-wrap gap-2">
            {followUps.map((followUp, index) => (
              <span
                key={`${followUp}-${index}`}
                className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200"
              >
                {followUp}
              </span>
            ))}
          </div>
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onHandleObjection}
          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-500/90 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-400/40 dark:hover:bg-rose-500"
          disabled={loading}
        >
          Handle objection
        </button>
        {trimmedError && (
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{formattedError}</span>
        )}
      </footer>
    </section>
  )
}

export default SalesHUD
