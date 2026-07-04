import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Film, PlusCircle } from 'lucide-react'
import { getProductions } from '@/app/actions/productions'
import { CreateProductionForm } from '@/components/productions/create-production-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProductionsPageProps {
  params: Promise<{ projectId: string }>
}

function label(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function stateTone(state: string) {
  if (state === 'completed') return 'border-[#b9d8c8] bg-[#f0f8f3] text-[#235c43]'
  if (state === 'awaiting_approval') return 'border-[#ead8a6] bg-[#fff8e3] text-[#7a5a08]'
  if (state === 'active') return 'border-[#b9d6df] bg-[#eef8fa] text-[#2f6673]'
  return 'border-[#e1e7e4] bg-white text-[#667780]'
}

function StateIcon({ state }: { state: string }) {
  if (state === 'completed') return <CheckCircle2 className="h-4 w-4" />
  if (state === 'awaiting_approval') return <Clock3 className="h-4 w-4" />
  return <Film className="h-4 w-4" />
}

export default async function ProductionsPage({ params }: ProductionsPageProps) {
  const { projectId } = await params
  const productions = await getProductions(projectId)
  const completedCount = productions.filter((production) => production.state === 'completed').length
  const activeCount = productions.filter((production) => production.state === 'active' || production.state === 'awaiting_approval').length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Production workspace
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Productions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Create, continue, and review production workflows from one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-96">
            <div className="rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-4">
              <p className="text-2xl font-semibold text-[#0f2433]">{productions.length}</p>
              <p className="mt-1 text-xs text-[#667780]">Total</p>
            </div>
            <div className="rounded-2xl border border-[#b9d6df] bg-[#eef8fa] p-4">
              <p className="text-2xl font-semibold text-[#2f6673]">{activeCount}</p>
              <p className="mt-1 text-xs text-[#667780]">Active</p>
            </div>
            <div className="rounded-2xl border border-[#b9d8c8] bg-[#f0f8f3] p-4">
              <p className="text-2xl font-semibold text-[#235c43]">{completedCount}</p>
              <p className="mt-1 text-xs text-[#667780]">Complete</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
            <PlusCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">New production</h2>
            <p className="text-sm text-[#667780]">Start a new workflow inside this project.</p>
          </div>
        </div>
        <CreateProductionForm projectId={projectId} />
      </section>

      <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Production list</h2>
            <p className="mt-1 text-sm text-[#667780]">Open a production to continue workflow tasks or review final outputs.</p>
          </div>
          <Badge variant="outline" className="w-fit">{productions.length} productions</Badge>
        </div>

        <div className="grid gap-3">
          {productions.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No productions yet. Create the first production above.
            </div>
          ) : (
            productions.map((production) => (
              <Link
                key={production.id}
                href={`/workspace/${projectId}/productions/${production.id}`}
                className="group rounded-2xl border border-[#e1e7e4] bg-white p-4 shadow-sm transition hover:border-[#b9d8c8] hover:bg-[#f8fbfa]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${stateTone(production.state)}`}>
                      <StateIcon state={production.state} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[#0f2433]">{production.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#667780]">
                        <Badge variant="outline" className="bg-white capitalize">{label(production.production_type)}</Badge>
                        <span>Created {new Date(production.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0">
                    <Badge variant="outline" className={`capitalize ${stateTone(production.state)}`}>
                      {label(production.state)}
                    </Badge>
                    <Button asChild size="sm" variant="outline" className="hidden group-hover:border-[#2f7f73] group-hover:text-[#2f7f73] sm:inline-flex">
                      <span>
                        Open
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </span>
                    </Button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
