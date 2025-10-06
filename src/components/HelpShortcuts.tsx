const shortcuts = [
  ['N', 'New card'],
  ['F', 'New frame'],
  ['/', 'Search'],
  ['⌘ / Ctrl + K', 'Command palette'],
  ['⌘ / Ctrl + S', 'Save snapshot'],
  ['⌘ / Ctrl + Z', 'Undo'],
  ['⌘ / Ctrl + Y', 'Redo'],
  ['⌘ / Ctrl + E', 'Export']
]

export default function HelpShortcuts() {
  return (
    <section className="glass-panel space-y-3 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Shortcuts</h3>
      <ul className="space-y-2">
        {shortcuts.map(([keys, desc]) => (
          <li key={keys} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-xs shadow-sm dark:bg-slate-900/60">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{desc}</span>
            <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-200">
              {keys}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
