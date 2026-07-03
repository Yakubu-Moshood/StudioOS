'use client'

import { useTransition } from 'react'
import { decideProductionPackageVersion } from '@/app/actions/production-packages'
import type { ProductionPackageVersionView } from '@/app/actions/production-packages'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PkgReview(props: {
  projectId: string
  productionId: string
  version: ProductionPackageVersionView
}) {
  const [pending, startTransition] = useTransition()

  function decide(decision: 'approved' | 'revision_requested') {
    startTransition(async () => {
      const result = await decideProductionPackageVersion({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: props.version.id,
        decision,
      })
      if (!result.success) return toast.error(result.error)
      toast.success(decision === 'approved' ? 'Production completed.' : 'Revision requested.')
    })
  }

  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button variant="outline" disabled={pending} onClick={() => decide('revision_requested')}>
        Request revision
      </Button>
      <Button disabled={pending} onClick={() => decide('approved')}>
        Approve package
      </Button>
    </div>
  )
}
