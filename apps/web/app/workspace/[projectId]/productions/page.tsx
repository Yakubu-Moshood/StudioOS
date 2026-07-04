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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <section className="w-full rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Production workspace
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#0f2433] sm:text-3xl">Productions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Create the executable workflow for this project. Start here when you are ready to move from planning into production.
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-center sm:gap-3 xl:max-w-md">
            <div className="min-w-0 rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-3 sm:p-4">
              <p className="text-xl font-semibold text-[#0f2433] sm:text-2xl">{productions.length}</p>
              <p className="mt-1 text-xs text-[#667780]">Total</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-[#b9d6df] bg-[#eef8fa] p-3 sm:p-4">
              <p className="text-xl font-semibold text-[#2f6673] sm:text-2xl">{activeCount}</p>
              <p className="mt-1 text-xs text-[#667780]">Active</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-[#b9d8c8] bg-[#f0f8f3] p-3 sm:p-4">
              <p className="text-xl font-semibold text-[#235c43] sm:text-2xl">{completedCount}</p>
              <p className="mt-1 text-xs text-[#667780]">Complete</p>
            </div>
          </div>
        </div>
      </section>

      {productions.length === 0 && (
        <section className="w-full rounded-[1.5rem] border border-[#dce6e2] bg-[#f8fbfa] p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#0f2433]">Recommended first move</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#667780]">
            Create one Production for the project. For launch, the clearest path is an Advertising Campaign production because it already has the full guided workflow.
          </p>
        </section>
      )}

      <section className="w-full rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
            <PlusCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">New production</h2>
            <p className="text-sm text-[#667780]">Start the workflow that will produce the final output.</p>
          </div>
        </div>
        <CreateProductionForm projectId={projectId} />
      </section>

      <section className="w-full rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Production list</h2>
            <p className="mt-1 text-sm text-[#667780]">Open a production to continue workflow tasks or review final outputs.</p>
          </div>
          <Badge variant="outline" className="w-fit shrink-0">{productions.length} productions</Badge>
        </div>

        <div className="grid gap-3">
          {productions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbded8] bg-white/70 p-8 text-center">
              <p className="text-sm font-medium text-[#0f2433]">No productions yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667780]">
                Use the form above to create the first production workflow for this project.
              </p>
            </div>
          ) : (
            productions.map((production) => (
              <Link
                key={production.id}
                href={`/workspace/${projectId}/productions/${production.id}`}
                className="group block w-full rounded-2xl border border-[#e1e7e4] bg-white p-4 shadow-sm transition hover:border-[#b9d8c8] hover:bg-[#f8fbfa]"
              >
                <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${stateTone(production.state)}`}>
                      <StateIcon state={production.state} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-[#0f2433]">{production.title}</h3>
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[#667780]">
                        <Badge variant="outline" className="max-w-full bg-white capitalize">{label(production.production_type)}</Badge>
                        <span className="shrink-0">Created {new Date(production.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:shrink-0 md:justify-end">
                    <Badge variant="outline" className={`capitalize ${stateTone(production.state)}`}>
                      {label(production.state)}
                    </Badge>
                    <Button asChild size="sm" variant="outline" className="border-[#d2ded9] md:group-hover:border-[#2f7f73] md:group-hover:text-[#2f7f73]">
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
