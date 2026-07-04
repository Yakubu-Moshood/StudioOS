import { Badge } from '@/components/ui/badge'
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Context library
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Knowledge</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Store research notes, references, and source material that support the project workflow.
            </p>
          </div>
          <AddKnowledgeButton projectId={projectId} />
        </div>
      </section>

      {entries.length === 0 ? (
        <KnowledgeEmptyState />
      ) : (
        <KnowledgeList projectId={projectId} entries={entries} />
      )}
    </div>
  )
}
