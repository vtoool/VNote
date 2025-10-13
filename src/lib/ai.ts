import { createChatCompletion, type ChatMessage, type ChatRequestOptions } from './chatClient'

export type { ChatMessage, ChatRequestOptions } from './chatClient'

export async function chat(messages: ChatMessage[], opts?: ChatRequestOptions): Promise<string> {
  const { content } = await createChatCompletion(messages, {
    max_tokens: opts?.max_tokens ?? 600,
    temperature: opts?.temperature ?? 0.3,
    model: opts?.model,
    response_format: opts?.response_format,
    stop: opts?.stop,
    signal: opts?.signal
  })
  return content
}
