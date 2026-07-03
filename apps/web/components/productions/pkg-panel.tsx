'use client'

import { useTransition } from 'react'
import { assembleProductionPackage } from '@/app/actions/production-packages'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Props = {
  projectId: string
  productionId: string
  enabled: boolean
}

export function PkgPanel({ projectId, productionId, enabled }: Props) {
  const [pending, startTransition] = useTransition()

  function assemble() {
    startTransition(async () => {
      const result = await assembleProductionPackage({ projectId, productionId })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Package assembled.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <h2 className="font-medium">Production Package</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Uses the approved Brief, Research and Script versions.
      </p>
      <div className="mt-4 flex justify-end">
        <Button onClick={assemble} disabled={pending || !enabled}>
          {pending ? 'Assembling…' : 'Assemble package'}
        </Button>
      </div>
    </section>
  )
}
