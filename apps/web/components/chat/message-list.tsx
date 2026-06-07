import type { Message } from '@studioos/shared'
import { MessageBubble } from './message-bubble'
import { ChatEmptyState } from './chat-empty-state'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return <ChatEmptyState />
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}
