export type ChatRole = "system" | "user" | "assistant"
export type ChatMessage = { role: ChatRole; content: string }

export async function chat(
  messages: ChatMessage[],
  opts?: { max_tokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const base = import.meta.env.VITE_AI_URL
  if (!base) throw new Error("Missing VITE_AI_URL")

  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      max_tokens: opts?.max_tokens ?? 600,
      temperature: opts?.temperature ?? 0.3,
      model: opts?.model
    })
  })
  if (!res.ok) throw new Error(`AI failed ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ""
}
