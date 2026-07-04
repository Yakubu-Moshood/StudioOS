import { CheckCircle2, Circle, Clock3, PlayCircle } from 'lucide-react'
import type { ProductionStage } from '@studioos/shared'
import { Badge } from '@/components/ui/badge'

function statusLabel(status: string) {
  return status.replace('_', ' ')
}

function statusTone(status: string) {
  if (status === 'completed') return 'border-[#b9d8c8] bg-[#f0f8f3] text-[#235c43]'
  if (status === 'awaiting_approval') return 'border-[#ead8a6] bg-[#fff8e3] text-[#7a5a08]'
  if (status === 'ready' || status === 'active') return 'border-[#b9d6df] bg-[#eef8fa] text-[#2f6673]'
  return 'border-[#e1e7e4] bg-white text-[#667780]'
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />
  if (status === 'awaiting_approval') return <Clock3 className="h-4 w-4" />
  if (status === 'ready' || status === 'active') return <PlayCircle className="h-4 w-4" />
  return <Circle className="h-4 w-4" />
}

function findCurrentStage(stages: ProductionStage[]) {
  return stages.find((stage) => ['ready', 'active', 'awaiting_approval', 'failed'].includes(stage.status)) ?? stages.find((stage) => stage.status !== 'completed') ?? null
}

export function WorkflowOverview({ stages }: { stages: ProductionStage[] }) {
  const completedCount = stages.filter((stage) => stage.status === 'completed').length
  const currentStage = findCurrentStage(stages)
  const progress = stages.length ? Math.round((completedCount / stages.length) * 100) : 0

  return (
    <section className="rounded-[1.5rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              {completedCount}/{stages.length} completed
            </Badge>
            <Badge variant="outline">{progress}%</Badge>
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-[#0f2433]">Production Workflow</h2>
          <p className="mt-1 text-sm text-[#667780]">
            Follow the stages from discovery to final package. The next action is highlighted below.
          </p>
        </div>

        <div className="rounded-2xl border border-[#dce6e2] bg-[#f8fbfa] p-4 lg:min-w-72">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#6d8580]">Next focus</p>
          <p className="mt-2 font-semibold text-[#0f2433]">{currentStage ? currentStage.title : 'Production complete'}</p>
          <p className="mt-1 text-sm capitalize text-[#667780]">{currentStage ? statusLabel(currentStage.status) : 'completed'}</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#edf2f0]">
        <div className="h-full rounded-full bg-[#2f7f73]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const isCurrent = currentStage?.id === stage.id

          return (
            <div key={stage.id} className={`rounded-2xl border p-3 transition ${statusTone(stage.status)} ${isCurrent ? 'ring-2 ring-[#2f7f73]/25' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-semibold">
                  {stage.position}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={stage.status} />
                    <p className="truncate text-sm font-semibold">{stage.title}</p>
                  </div>
                  <p className="mt-1 text-xs capitalize opacity-80">{statusLabel(stage.status)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
