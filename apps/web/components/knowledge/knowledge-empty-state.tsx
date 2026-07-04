import { BookOpen } from 'lucide-react'

export function KnowledgeEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-[#cbded8] bg-white/70 p-8 text-center shadow-sm sm:p-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3faf7] text-[#2f7f73]">
        <BookOpen className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#0f2433]">No knowledge entries yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667780]">
          Add research notes, references, and documents to support the project workflow.
        </p>
      </div>
    </div>
  )
}
