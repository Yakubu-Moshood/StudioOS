import { Badge } from '@/components/ui/badge'
import { getOrCreateConversation } from '@/app/actions/chat'
import { ChatInterface } from './chat-interface'

interface ChatViewProps {
  projectId: string
}

export async function ChatView({ projectId }: ChatViewProps) {
  const conversation = await getOrCreateConversation(projectId)

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="shrink-0 rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
          Project assistant
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">AI</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
          Ask project questions, explore ideas, and get practical next-step suggestions.
        </p>
      </section>

      <ChatInterface projectId={projectId} initialMessages={conversation.messages} />
    </div>
  )
}
