import { useState } from 'react'

type PlanItem = { id: string; owner: string; action: string; due: string }

interface MutualActionPlanProps {
  onExport: (items: PlanItem[]) => void
}

export default function MutualActionPlan({ onExport }: MutualActionPlanProps) {
  const [items, setItems] = useState<PlanItem[]>([])

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), owner: '', action: '', due: '' }])
  }

  return (
    <section className="glass-panel space-y-4 p-4 text-sm">
      <header className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mutual action plan</h3>
        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
          >
            Add action
          </button>
          <button
            onClick={() => onExport(items)}
            className="rounded-2xl bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
          >
            Export
          </button>
        </div>
      </header>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-3 rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-900/60 sm:grid-cols-3">
            <input
              value={item.owner}
              onChange={(event) =>
                setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, owner: event.target.value } : entry)))
              }
              placeholder="Owner"
              className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
            />
            <input
              value={item.action}
              onChange={(event) =>
                setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, action: event.target.value } : entry)))
              }
              placeholder="Action"
              className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
            />
            <input
              value={item.due}
              onChange={(event) =>
                setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, due: event.target.value } : entry)))
              }
              placeholder="Due"
              className="rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/60"
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl bg-indigo-500/5 p-4 text-xs text-indigo-600 dark:text-indigo-200">
            Capture commitments across your team and customer to keep momentum strong.
          </p>
        )}
      </div>
    </section>
  )
}
