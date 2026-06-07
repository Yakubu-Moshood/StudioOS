import type { KnowledgeEntry } from '@studioos/shared'
import { KnowledgeCard } from './knowledge-card'

interface KnowledgeListProps {
  projectId: string
  entries: KnowledgeEntry[]
}

export function KnowledgeList({ projectId, entries }: KnowledgeListProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <KnowledgeCard key={entry.id} projectId={projectId} entry={entry} />
      ))}
    </div>
  )
}
