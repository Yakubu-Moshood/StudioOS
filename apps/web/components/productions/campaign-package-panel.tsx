'use client'

import { useState, useTransition } from 'react'
import { assembleCampaignProductionPackage, decideCampaignProductionPackage, type CampaignPackageVersion } from '@/app/actions/campaign-production-package'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function CampaignPackagePanel(props: { projectId: string; productionId: string; enabled: boolean; versions: CampaignPackageVersion[] }) {
  const latest = props.versions[0] ?? null
  const content = latest?.content as Record<string, unknown> | undefined
  const decision = latest?.approval?.decision ?? null
  const [channels, setChannels] = useState('YouTube, Instagram, Facebook')
  const [campaignUrl, setCampaignUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()

  function assemble() {
    if (!channels.trim()) return void toast.error('Deployment channels are required.')
    startTransition(async () => {
      const result = await assembleCampaignProductionPackage({
        projectId: props.projectId,
        productionId: props.productionId,
        deploymentChannels: channels,
        campaignUrl,
        deploymentNotes: notes,
      })
      if (!result.success) return void toast.error(result.error)
      toast.success(`Campaign Production Package version ${result.data.version_number} assembled.`)
    })
  }

  function decide(value: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideCampaignProductionPackage({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: latest.id,
        decision: value,
        comment,
      })
      if (!result.success) return void toast.error(result.error)
      setComment('')
      toast.success(value === 'approved' ? 'Production completed.' : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Campaign Deployment & Production Package</h2>
          <p className="mt-1 text-sm text-muted-foreground">Assembles every approved campaign artifact and records the deployment plan.</p>
        </div>
        {latest ? <Badge variant="outline">Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}</Badge> : null}
      </div>

      {latest ? (
        <div className="mt-4 grid gap-3 rounded-md bg-muted/40 p-4 text-sm sm:grid-cols-2">
          <div><span className="font-medium">Channels:</span> {String(content?.deployment_channels ?? 'Not recorded')}</div>
          <div><span className="font-medium">Campaign URL:</span> {content?.campaign_url ? <a className="underline" href={String(content.campaign_url)} target="_blank" rel="noreferrer">Open campaign</a> : 'Not provided'}</div>
          <div className="sm:col-span-2"><span className="font-medium">Approved artifacts:</span> {Object.keys((content?.approved_source_versions as Record<string, unknown> | undefined) ?? {}).length}</div>
        </div>
      ) : null}

      {decision !== 'approved' ? (
        <div className="mt-4 grid gap-3">
          <Input value={channels} onChange={(event) => setChannels(event.target.value)} placeholder="Deployment channels" disabled={pending || !props.enabled} />
          <Input value={campaignUrl} onChange={(event) => setCampaignUrl(event.target.value)} placeholder="Campaign or launch URL (optional)" disabled={pending || !props.enabled} />
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Deployment and handover notes" disabled={pending || !props.enabled} />
          <div className="flex justify-end"><Button onClick={assemble} disabled={pending || !props.enabled}>{pending ? 'Assembling…' : latest ? 'Assemble new version' : 'Assemble final package'}</Button></div>
        </div>
      ) : null}

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Final approval note or revision details" disabled={pending} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve and Complete Production</Button>
          </div>
        </div>
      ) : null}

      {decision === 'approved' ? <div className="mt-4 rounded-md bg-muted/40 p-4 text-sm font-medium">Production completed successfully.</div> : null}
    </section>
  )
}
