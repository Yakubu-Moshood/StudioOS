import { ChatView } from '@/components/chat/chat-view'

interface AiPanelProps {
  projectId: string
}

export function AiPanel({ projectId }: AiPanelProps) {
  return <ChatView projectId={projectId} />
}
