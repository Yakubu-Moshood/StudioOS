import { ArrowDownCircle } from 'lucide-react'
import type { ProductionStage } from '@studioos/shared'
import { Badge } from '@/components/ui/badge'

function statusLabel(status: string) {
  return status.replace('_', ' ')
}

function findNextStage(stages: ProductionStage[]) {
  return stages.find((stage) => ['ready', 'active', 'awaiting_approval', 'failed'].includes(stage.status)) ?? stages.find((stage) => stage.status !== 'completed') ?? null
}

export function ProductionNextAction({ stages }: { stages: ProductionStage[] }) {
  const nextStage = findNextStage(stages)

  if (!nextStage) {
    return (
      <section className="rounded-[1.5rem] border border-[#b9d8c8] bg-[#f0f8f3] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#235c43]">
            <ArrowDownCircle className="h-5 w-5" />
          </div>
          <div>
            <Badge className="bg-[#235c43] text-white hover:bg-[#235c43]">Complete</Badge>
            <h2 className="mt-2 font-semibold tracking-[-0.02em] text-[#0f2433]">Production completed</h2>
            <p className="mt-1 text-sm text-[#4f675f]">
              Review the Artifact Library for final outputs and package links.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[1.5rem] border border-[#cbded8] bg-[#f8fbfa] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2f7f73]">
          <ArrowDownCircle className="h-5 w-5" />
        </div>
        <div>
          <Badge variant="outline" className="border-[#cbded8] bg-white text-[#2f7f73]">Next action</Badge>
          <h2 className="mt-2 font-semibold tracking-[-0.02em] text-[#0f2433]">Continue with {nextStage.title}</h2>
          <p className="mt-1 text-sm capitalize text-[#667780]">
            Current status: {statusLabel(nextStage.status)}. Scroll to this stage panel below and complete the visible action.
          </p>
        </div>
      </div>
    </section>
  )
}
