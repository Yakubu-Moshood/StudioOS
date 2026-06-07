import { BookOpen } from 'lucide-react'

export function KnowledgeEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
      <BookOpen className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">No knowledge entries yet</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add research notes, references, and documents to enrich the AI context.
        </p>
      </div>
    </div>
  )
}
