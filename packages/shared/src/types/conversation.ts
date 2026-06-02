export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  project_id: string
  user_id: string
  title: string | null
  messages: Message[]
  created_at: string
  updated_at: string
}
