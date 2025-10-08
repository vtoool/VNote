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
      className="canvas-chat fixed right-0 top-0 h-full w-[360px] max-w-[90vw] bg-neutral-900/70 backdrop-blur text-sm border-l border-neutral-800 flex flex-col"
      style={{ zIndex: 30 }}
      aria-label="AI chat about this canvas"
    >
      <header className="p-3 flex items-center justify-between border-b border-neutral-800">
        <div className="font-medium">Ask AI about this canvas</div>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs border border-neutral-700 rounded"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"}
          </button>
          <button className="px-2 py-1 text-xs border border-neutral-700 rounded" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      {open && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "assistant" ? "text-blue-200" : "text-neutral-200"}>
                <div className="opacity-60 text-xs mb-1">{m.role}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {loading && <div className="text-xs opacity-70">Thinking…</div>}
            {error && <div className="text-xs text-red-400">{error}</div>}
          </div>

          <div className="p-3 border-t border-neutral-800">
            <textarea
              className="w-full h-24 resize-none p-2 bg-neutral-800 border border-neutral-700 rounded"
              placeholder="Ask about anything on this canvas… (Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs opacity-60">Context chars: {contextText.length}</div>
              <button
                className="px-3 py-1 border border-neutral-700 rounded disabled:opacity-50"
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
