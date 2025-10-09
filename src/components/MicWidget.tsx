import { useSpeech } from "@/lib/useSpeech"

export default function MicWidget({ onDone }: { onDone?: (finalText: string) => void }) {
  const { supported, listening, interim, finalText, lang, setLang, start, stop, clear } = useSpeech("en-US")

  if (!supported) {
    return (
      <div className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
        Speech-to-text not supported in this browser.
      </div>
    )
  }

  const handleStart = () => {
    clear()
    start()
  }

  const handleStop = () => {
    stop()
    const spoken = finalText.trim()
    if (spoken) {
      onDone?.(spoken)
    }
    clear()
  }

  return (
    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white/80 px-2 text-xs text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200/60 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-500/30"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="ro-RO">Română</option>
          <option value="es-ES">Español</option>
        </select>
        {!listening ? (
          <button
            type="button"
            onClick={handleStart}
            className="flex h-8 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-500/90 px-3 text-xs font-semibold text-white shadow transition hover:bg-emerald-500 dark:border-emerald-400/40"
          >
            <span aria-hidden="true">🎤</span>
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="flex h-8 items-center gap-1 rounded-full border border-rose-200 bg-rose-500/90 px-3 text-xs font-semibold text-white shadow transition hover:bg-rose-500 dark:border-rose-400/40"
          >
            <span aria-hidden="true">⏹</span>
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={clear}
          className="h-8 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-500 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/70"
        >
          Clear
        </button>
      </div>
      <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-600 shadow-inner dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200">
        <div className="mb-1">
          <strong className="font-semibold">Live:</strong>{" "}
          <span className="text-slate-400 dark:text-slate-400">{interim}</span>
        </div>
        <div>
          <strong className="font-semibold">Final:</strong> {finalText}
        </div>
      </div>
    </div>
  )
}
