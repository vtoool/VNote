import { useState } from 'react'
import { chat } from '@/lib/ai'

export function SummarizeButton({ text, onResult }: { text: string; onResult?: (s: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')

  async function handleClick() {
    setLoading(true)
    try {
      const content = await chat(
        [
          { role: 'system', content: 'You are a concise note helper.' },
          { role: 'user', content: 'Summarize this:\n' + (text ?? '').slice(0, 4000) }
        ],
        { max_tokens: 220, temperature: 0.2 }
      )
      setSummary(content)
      onResult?.(content)
    } catch (e: any) {
      alert(e.message || 'Summarization failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-summarize space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-200"
      >
        {loading ? 'Summarizing…' : 'Summarize note'}
      </button>
      {summary && (
        <div className="ai-summary space-y-2 rounded-2xl bg-white/80 p-3 text-sm shadow-sm dark:bg-slate-900/70">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Summary</h4>
          <p className="text-slate-600 dark:text-slate-200">{summary}</p>
        </div>
      )}
    </div>
  )
}
