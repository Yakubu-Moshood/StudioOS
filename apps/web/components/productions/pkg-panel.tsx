'use client'

import { useState, useTransition } from 'react'
import { assembleProductionPackage } from '@/app/actions/production-packages'
import type { ProductionPackageVersionView } from '@/app/actions/production-packages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Props = {
  projectId: string
  productionId: string
  enabled: boolean
  versions: ProductionPackageVersionView[]
}

function bodyOf(version: ProductionPackageVersionView['source_versions']['brief']) {
  return typeof version?.content?.body === 'string' ? version.content.body : ''
}

export function PkgPanel({ projectId, productionId, enabled, versions }: Props) {
  const [pending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const latest = versions[0] ?? null
  const decision = latest?.approval?.decision ?? null

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Production Package</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uses the approved Brief, Research and Script versions.
          </p>
        </div>
        {latest ? (
          <Badge variant="outline">
            Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}
          </Badge>
        ) : null}
      </div>

      {latest && isOpen ? (
        <div className="mt-5 space-y-5 border-t pt-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="font-medium">Package version</p>
              <p className="mt-1 text-muted-foreground">Version {latest.version_number}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="font-medium">Approval status</p>
              <p className="mt-1 capitalize text-muted-foreground">
                {decision?.replace('_', ' ') ?? 'Awaiting approval'}
              </p>
            </div>
          </div>

          <PackageSection title="Approved Brief" body={bodyOf(latest.source_versions.brief)} />
          <PackageSection title="Approved Research" body={bodyOf(latest.source_versions.research)} />
          <PackageSection title="Approved Script" body={bodyOf(latest.source_versions.script)} />
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        {latest ? (
          <Button variant="outline" onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? 'Hide package' : 'View package'}
          </Button>
        ) : null}
        <Button onClick={assemble} disabled={pending || !enabled}>
          {pending ? 'Assembling…' : latest ? 'Assemble new version' : 'Assemble package'}
        </Button>
      </div>
    </section>
  )
}

function PackageSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">
        {body || 'This source version has no readable text content.'}
      </div>
    </div>
  )
}
