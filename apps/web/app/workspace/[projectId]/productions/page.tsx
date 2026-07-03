import Link from 'next/link'
import { getProductions } from '@/app/actions/productions'
import { CreateProductionForm } from '@/components/productions/create-production-form'
import { Badge } from '@/components/ui/badge'

interface ProductionsPageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProductionsPage({ params }: ProductionsPageProps) {
  const { projectId } = await params
  const productions = await getProductions(projectId)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Productions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each production follows the approved Brief, Research, Script and Production Package workflow.
        </p>
      </div>

      <CreateProductionForm projectId={projectId} />

      <div className="grid gap-3">
        {productions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No productions yet. Create the first production above.
          </div>
        ) : (
          productions.map((production) => (
            <Link
              key={production.id}
              href={`/workspace/${projectId}/productions/${production.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/40"
            >
              <div>
                <h2 className="font-medium">{production.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {new Date(production.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="secondary">{production.state.replace('_', ' ')}</Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
