interface ShortcutBarProps {
  onInsert: (text: string) => void
}

const SHORTCUTS: { label: string; text: string }[] = [
  {
    label: 'Budget',
    text: "Let's unpack budget — what range have you already socialized for this?"
  },
  {
    label: 'Authority',
    text: 'Who else will weigh in on this decision and what do they care about most?'
  },
  {
    label: 'Need',
    text: 'What prompted the search for a better discovery workflow right now?'
  },
  {
    label: 'Timing',
    text: 'If we solved this in the next 30 days, what downstream impact would you expect?'
  }
]

export default function ShortcutBar({ onInsert }: ShortcutBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {SHORTCUTS.map((shortcut) => (
        <button
          key={shortcut.label}
          type="button"
          onClick={() => onInsert(shortcut.text)}
          className="rounded-full border border-indigo-200/70 bg-white/80 px-3 py-1 font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 dark:border-indigo-400/40 dark:bg-slate-900/40 dark:text-indigo-200 dark:hover:bg-slate-900/60"
        >
          {shortcut.label}
        </button>
      ))}
    </div>
  )
}
