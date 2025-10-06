import { Card } from '../lib/storage'

interface ObjectionsLogProps {
  cards: Card[]
}

export default function ObjectionsLog({ cards }: ObjectionsLogProps) {
  const objections = cards.filter((card) => card.tags.includes('objection'))
  if (objections.length === 0) return null
  return (
    <section className="glass-panel p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-400">Objections log</h3>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2">Question</th>
            <th className="pb-2">Answer</th>
            <th className="pb-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {objections.map((card) => (
            <tr key={card.id} className="border-t border-white/30 text-sm dark:border-slate-800/60">
              <td className="py-2 font-semibold text-slate-700 dark:text-slate-100">{card.title}</td>
              <td className="py-2 text-slate-500 dark:text-slate-300">{'answer' in card ? card.answer : card.content}</td>
              <td className="py-2 text-slate-500 dark:text-slate-300">{card.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
