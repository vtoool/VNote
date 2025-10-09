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
  error
}: SalesHUDProps) {
  const trimmedError = error?.trim() ?? ''
  const resolvedLine = streamingNextLine?.trim().length
    ? streamingNextLine.trim()
    : proposal?.nextLine?.trim() ?? ''
  const fallbackMessage = 'Log what you just said to receive the next best line.'
  const formattedError = trimmedError.length > 220 ? `${trimmedError.slice(0, 219)}…` : trimmedError
  const displayLine = trimmedError ? `Assistant unavailable: ${formattedError}` : resolvedLine || fallbackMessage
  const hasResolvedLine = Boolean(resolvedLine)

  const alternatives = useMemo(() => {
    const unique = new Set<string>()
    proposal?.followups.forEach((item) => {
      const trimmed = item.trim()
      if (trimmed) unique.add(trimmed)
    })
    if (proposal?.objection.detected) {
      proposal.objection.suggestions.forEach((item) => {
        const trimmed = item.trim()
        if (trimmed) unique.add(trimmed)
      })
    }
    return Array.from(unique)
  }, [proposal])

  const handleCopy = () => {
    if (!hasResolvedLine) return
    onCopy?.(resolvedLine)
  }

  return (
    <section className="glass-panel space-y-4 p-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Next Best Thing to Say</p>
          <div className="mt-2 text-2xl font-semibold leading-snug text-slate-800 dark:text-slate-100">
            {loading ? (
              <span className="animate-pulse text-base font-medium text-slate-500 dark:text-slate-400">
                Groq is drafting…
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
          {proposal?.expectedCustomerReplyType && (
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Expect a {proposal.expectedCustomerReplyType.replace('_', ' ')} reply
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-indigo-200 bg-indigo-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-400/60"
            disabled={!hasResolvedLine}
          >
            Copy line
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`inline-flex h-3 w-3 rounded-full ${sentimentColor(sentiment)}`}
              aria-hidden="true"
            />
            <span>{sentimentLabel(sentiment)} sentiment</span>
          </div>
        </div>
      </header>

      {proposal?.rationale && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Why it matters</p>
          <p className="mt-1 leading-relaxed">{proposal.rationale}</p>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Sound-alike alternatives</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.slice(0, 4).map((alternative, index) => (
              <span
                key={`${alternative}-${index}`}
                className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200"
              >
                {alternative}
              </span>
            ))}
          </div>
        </div>
      )}

      {proposal?.objection.detected && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-700 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
          <p className="text-xs font-semibold uppercase tracking-wide">Objection spotted</p>
          <p className="mt-1 text-sm">
            Category: {proposal.objection.category ?? 'unspecified'}
          </p>
          {proposal.objection.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-700/90 dark:text-amber-100">
              {proposal.objection.suggestions.map((suggestion, index) => (
                <li key={`${suggestion}-${index}`}>• {suggestion}</li>
              ))}
            </ul>
          )}
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
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {formattedError}
          </span>
        )}
      </footer>
    </section>
  )
}

export default SalesHUD
