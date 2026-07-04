'use client'

import { useState, useTransition } from 'react'
import { decideDeliveryPackage, registerDeliveryPackage, startDelivery, type DeliveryVersion } from '@/app/actions/delivery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductionArtifactUpload } from '@/components/productions/production-artifact-upload'
import { toast } from 'sonner'

export function DeliveryPanel(props: { projectId: string; productionId: string; canStart: boolean; versions: DeliveryVersion[]; activeRunId?: string | null }) {
  const latest = props.versions[0] ?? null
  const content = latest?.content as Record<string, unknown> | undefined
  const deliveryUrl = typeof content?.delivery_url === 'string' ? content.delivery_url : ''
  const decision = latest?.approval?.decision ?? null
  const [runId, setRunId] = useState(props.activeRunId ?? '')
  const [method, setMethod] = useState('Manual delivery')
  const [recipient, setRecipient] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [comment, setComment] = useState('')
  const [master, setMaster] = useState(false)
  const [captions, setCaptions] = useState(false)
  const [thumbnail, setThumbnail] = useState(false)
  const [usageNotes, setUsageNotes] = useState(false)
  const [pending, startTransition] = useTransition()

  function startRun() {
    startTransition(async () => {
      const result = await startDelivery({ projectId: props.projectId, productionId: props.productionId })
      if (!result.success) return void toast.error(result.error)
      setRunId(result.data.id)
      toast.success('Delivery run started.')
    })
  }

  function registerPackage() {
    if (!runId || !url.trim() || !method.trim()) return void toast.error('Run, delivery method and delivery URL are required.')
    if (![master, captions, thumbnail, usageNotes].every(Boolean)) return void toast.error('Complete every Delivery checklist item first.')
    startTransition(async () => {
      const result = await registerDeliveryPackage({
        projectId: props.projectId,
        productionId: props.productionId,
        runId,
        deliveryUrl: url,
        deliveryMethod: method,
        recipientName: recipient,
        notes,
        masterIncluded: master,
        captionsIncluded: captions,
        thumbnailIncluded: thumbnail,
        usageNotesIncluded: usageNotes,
      })
      if (!result.success) return void toast.error(result.error)
      setRunId('')
      setUrl('')
      setNotes('')
      toast.success(`Delivery Package version ${result.data.version_number} registered.`)
    })
  }

  function decide(value: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideDeliveryPackage({ projectId: props.projectId, productionId: props.productionId, artifactVersionId: latest.id, decision: value, comment })
      if (!result.success) return void toast.error(result.error)
      setComment('')
      toast.success(value === 'approved' ? 'Delivery Package approved.' : 'Revision requested.')
    })
  }

  const checks = [
    ['Final master included', master, setMaster],
    ['Captions included', captions, setCaptions],
    ['Thumbnail or campaign artwork included', thumbnail, setThumbnail],
    ['Usage and handover notes included', usageNotes, setUsageNotes],
  ] as const

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Delivery</h2>
          <p className="mt-1 text-sm text-muted-foreground">Packages the approved master and handover files for final delivery.</p>
        </div>
        {latest ? <Badge variant="outline">Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}</Badge> : null}
      </div>

      {deliveryUrl ? <div className="mt-4 rounded-md bg-muted/40 p-4 text-sm"><a className="underline" href={deliveryUrl} target="_blank" rel="noreferrer">Open Delivery Package</a></div> : null}

      <div className="mt-4 space-y-3">
        {!runId ? <Button onClick={startRun} disabled={pending || !props.canStart}>{pending ? 'Starting…' : latest ? 'Start delivery revision' : 'Start Delivery'}</Button> : (
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">Active run recovered: {runId}</div>
            <div className="grid gap-2 rounded-md bg-muted/40 p-4">
              {checks.map(([label, checked, setter]) => (
                <label key={label} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={(event) => setter(event.target.checked)} disabled={pending} />
                  {label}
                </label>
              ))}
            </div>
            <Input value={method} onChange={(event) => setMethod(event.target.value)} placeholder="Delivery method" disabled={pending} />
            <Input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Recipient or client name" disabled={pending} />
            <ProductionArtifactUpload productionId={props.productionId} artifactKind="delivery-package" disabled={pending} onUploaded={setUrl} />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Delivery package URL" disabled={pending} />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional delivery notes" disabled={pending} />
            <div className="flex justify-end"><Button onClick={registerPackage} disabled={pending}>{pending ? 'Saving…' : 'Register Delivery Package'}</Button></div>
          </div>
        )}
      </div>

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Approval note or revision details" disabled={pending} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve Delivery Package</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
