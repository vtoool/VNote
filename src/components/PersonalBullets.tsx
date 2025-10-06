interface PersonalBulletsProps {
  bullets: string[]
}

export default function PersonalBullets({ bullets }: PersonalBulletsProps) {
  if (bullets.length === 0) return null
  return (
    <aside className="glass-panel space-y-3 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Personal bullets</h3>
      <ul className="space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-2 text-slate-600 dark:text-slate-200">
            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
