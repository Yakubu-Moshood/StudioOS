import { getOrCreateConversation } from '@/app/actions/chat'
import { ChatInterface } from './chat-interface'

interface ChatViewProps {
  projectId: string
}

export async function ChatView({ projectId }: ChatViewProps) {
  const conversation = await getOrCreateConversation(projectId)

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="shrink-0">
        <h2 className="text-base font-semibold">AI</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Project AI assistant — ask anything about your project.
        </p>
      </div>
      <ChatInterface projectId={projectId} initialMessages={conversation.messages} />
    </div>
  )
}
