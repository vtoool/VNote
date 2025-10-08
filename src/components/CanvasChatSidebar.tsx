import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { chat, ChatMessage } from "@/lib/ai"
import { getCanvasPlainText } from "@/lib/canvasText"

type Props = {
  canvas: any
  canvasId: string
  onClose?: () => void
}

export default function CanvasChatSidebar({ canvas, canvasId, onClose }: Props) {
  const [open, setOpen] = useState(true)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(`vnote.chat.${canvasId}`)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(`vnote.chat.${canvasId}`, JSON.stringify(messages))
  }, [messages, canvasId])

  const contextText = useMemo(() => {
    const text = getCanvasPlainText(canvas)
    // Keep context modest to avoid token blowup
    return text.slice(0, 6000)
  }, [canvas])

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    setError(null)
    const userMsg: ChatMessage = { role: "user", content: input.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)
    try {
      const system: ChatMessage = {
        role: "system",
        content:
          "You are a helpful assistant for a canvas app. Use the provided context to answer questions. " +
          "If the answer isn't in the context, say so briefly. Be concise."
      }
      const contextMsg: ChatMessage = {
        role: "user",
        content: `CONTEXT (from canvas):\n${contextText || "(empty)"}`
      }
      const answer = await chat([system, contextMsg, ...nextMessages], { max_tokens: 500, temperature: 0.2 })
      setMessages((prev) => [...prev, { role: "assistant", content: answer }])
    } catch (e: any) {
      setError(e?.message || "Failed to get AI response")
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <aside
      className="canvas-chat pointer-events-auto fixed bottom-6 right-6 z-30 flex w-[min(360px,calc(100vw-3rem))] max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 text-sm shadow-2xl backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/85"
      aria-label="AI chat about this canvas"
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/40 px-4 py-3 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200">
        <div className="font-semibold tracking-tight">Ask AI about this canvas</div>
        <div className="flex items-center gap-2 text-xs">
          <button
            className="rounded-full border border-slate-300/70 px-3 py-1 font-medium text-slate-600 transition hover:bg-white/70 dark:border-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-800/60"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"}
          </button>
          <button
            className="rounded-full border border-slate-300/70 px-3 py-1 font-medium text-slate-600 transition hover:bg-white/70 dark:border-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-800/60"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </header>

      {open && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-auto bg-white/30 px-4 py-3 backdrop-blur-sm dark:bg-slate-900/20">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border px-3 py-2 text-sm shadow-sm backdrop-blur ${
                    m.role === "assistant"
                      ? "border-indigo-200/80 bg-indigo-50/80 text-slate-800 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-slate-100"
                      : "border-slate-200/80 bg-white/80 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-400">
                    {m.role}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              ))}
              {loading && <div className="text-xs text-slate-500 dark:text-slate-400">Thinking…</div>}
              {error && <div className="text-xs text-rose-500 dark:text-rose-400">{error}</div>}
            </div>
          </div>

          <div className="border-t border-slate-200/70 bg-white/50 px-4 py-3 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/30">
            <textarea
              className="h-24 w-full resize-none rounded-2xl border border-slate-200/80 bg-white/80 p-3 text-slate-700 shadow-inner outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:border-indigo-400/40 dark:focus:ring-indigo-500/30"
              placeholder="Ask about anything on this canvas… (Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>Context chars: {contextText.length}</div>
              <button
                className="rounded-full border border-indigo-200 bg-indigo-500/90 px-4 py-1 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-500 dark:border-indigo-400/40"
                onClick={send}
                disabled={loading || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
