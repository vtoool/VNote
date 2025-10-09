import { useEffect, useRef } from "react"

import { useSpeech } from "@/lib/useSpeech"

export default function MicWidget({ onDone }: { onDone?: (finalText: string) => void }) {
  const { supported, listening, finalText, start, stop, clear } = useSpeech()

  const previousListeningRef = useRef(listening)

  useEffect(() => {
    const wasListening = previousListeningRef.current
    if (wasListening && !listening) {
      const spoken = finalText.trim()
      if (spoken) {
        onDone?.(spoken)
      }
      clear()
    }
    previousListeningRef.current = listening
  }, [clear, finalText, listening, onDone])

  if (!supported) {
    return (
      <div className="rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
        Speech-to-text not supported in this browser.
      </div>
    )
  }

  const handleToggle = () => {
    if (listening) {
      stop()
    } else {
      clear()
      start()
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 ${
          listening
            ? "border-rose-300 bg-rose-500 text-white shadow-sm dark:border-rose-400/60"
            : "border-emerald-200 bg-emerald-500/90 text-white shadow-sm hover:bg-emerald-500 dark:border-emerald-400/50"
        }`}
      >
        <span aria-hidden="true">🎤</span>
      </button>
      <div className="text-[11px] text-slate-400 dark:text-slate-500">
        {listening ? "Listening…" : "Tap the mic to speak"}
      </div>
    </div>
  )
}
