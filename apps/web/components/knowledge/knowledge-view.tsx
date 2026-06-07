import { getKnowledgeEntries } from '@/app/actions/knowledge'
import { KnowledgeList } from './knowledge-list'
import { KnowledgeEmptyState } from './knowledge-empty-state'
import { AddKnowledgeButton } from './add-knowledge-button'

interface KnowledgeViewProps {
  projectId: string
}

export async function KnowledgeView({ projectId }: KnowledgeViewProps) {
  const entries = await getKnowledgeEntries(projectId)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Knowledge Base</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Research notes, references, and documents available to the AI.
          </p>
        </div>
        <AddKnowledgeButton projectId={projectId} />
      </div>
      {entries.length === 0 ? (
        <KnowledgeEmptyState />
      ) : (
        <KnowledgeList projectId={projectId} entries={entries} />
      )}
    </div>
  )
}
