interface ToastProps {
  savingState: 'idle' | 'saving' | 'saved'
}

export default function Toast({ savingState }: ToastProps) {
  if (savingState === 'idle') return null
  const message = savingState === 'saving' ? 'Autosaving…' : 'All changes saved'
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="glass-panel flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-200">
        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
        {message}
      </div>
    </div>
  )
}
