import { KnowledgeView } from '@/components/knowledge/knowledge-view'

interface KnowledgePanelProps {
  projectId: string
}

export function KnowledgePanel({ projectId }: KnowledgePanelProps) {
  return <KnowledgeView projectId={projectId} />
}
