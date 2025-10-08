export function getCanvasPlainText(canvas: any): string {
  // TODO: Replace with real selector. For now, try best-effort:
  // - If canvas has nodes/cards, join their text fields.
  // - Strip markdown/HTML.
  if (!canvas) return ""
  try {
    const parts: string[] = []
    const items = canvas.cards || canvas.items || canvas.nodes || []
    for (const it of items) {
      if (!it) continue
      if (Array.isArray(it.checklist)) {
        const checklist = it.checklist
          .map((item: any) => {
            const prefix = item?.completed ? "[x]" : "[ ]"
            return item?.text ? `${prefix} ${item.text}` : ""
          })
          .filter(Boolean)
          .join("\n")
        if (checklist) parts.push(checklist)
      }
      if (Array.isArray(it.answers)) {
        for (const ans of it.answers) {
          if (ans) parts.push(String(ans))
        }
      }
      const fields = [it.title, it.text, it.content, it.answer, it.description]
      for (const field of fields) {
        if (field) parts.push(String(field))
      }
    }
    const joined = parts.join("\n\n")
    return joined.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim()
  } catch {
    return ""
  }
}
