export function normalizeAgentName(name: string): string {
  const trimmed = name.trim()
  return trimmed || 'Your agent'
}

export function personalizeAgentText(text: string, agentName: string): string {
  return text.replace(/\{agent\}/gi, normalizeAgentName(agentName))
}
