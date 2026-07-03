'use client'

import { useState, useTransition } from 'react'
import { decidePostProductionMaster, registerPostProductionMaster, startPostProduction, type PostProductionVersion } from '@/app/actions/post-production'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function PostProductionPanel(props: { projectId: string; productionId: string; canStart: boolean; versions: PostProductionVersion[] }) {
  const latest = props.versions[0] ?? null
  const content = latest?.content as Record<string, unknown> | undefined
  const masterUrl = typeof content?.master_url === 'string' ? content.master_url : ''
  const decision = latest?.approval?.decision ?? null
  const [runId, setRunId] = useState('')
  const [provider, setProvider] = useState('manual')
  const [workflow, setWorkflow] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [comment, setComment] = useState('')
  const [edit, setEdit] = useState(false)
  const [sound, setSound] = useState(false)
  const [colour, setColour] = useState(false)
  const [graphics, setGraphics] = useState(false)
  const [captions, setCaptions] = useState(false)
  const [pending, startTransition] = useTransition()

  function startRun() {
    startTransition(async () => {
      const result = await startPostProduction({ projectId: props.projectId, productionId: props.productionId })
      if (!result.success) return void toast.error(result.error)
      setRunId(result.data.id)
      toast.success('Post-production run started.')
    })
  }

  function registerMaster() {
    if (!runId || !url.trim() || !provider.trim()) return void toast.error('Run, provider and master URL are required.')
    if (![edit, sound, colour, graphics, captions].every(Boolean)) return void toast.error('Complete every Post-production checklist item first.')
    startTransition(async () => {
      const result = await registerPostProductionMaster({
        projectId: props.projectId,
        productionId: props.productionId,
        runId,
        masterUrl: url,
        provider,
        workflow,
        notes,
        editComplete: edit,
        soundComplete: sound,
        colourComplete: colour,
        graphicsComplete: graphics,
        captionsComplete: captions,
      })
      if (!result.success) return void toast.error(result.error)
      setRunId('')
      setUrl('')
      setNotes('')
      toast.success(`Post-production Master version ${result.data.version_number} registered.`)
    })
  }

  function decide(value: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decidePostProductionMaster({ projectId: props.projectId, productionId: props.productionId, artifactVersionId: latest.id, decision: value, comment })
      if (!result.success) return void toast.error(result.error)
      setComment('')
      toast.success(value === 'approved' ? 'Post-production Master approved.' : 'Revision requested.')
    })
  }

  const checks = [
    ['Picture edit complete', edit, setEdit],
    ['Sound mix complete', sound, setSound],
    ['Colour grade complete', colour, setColour],
    ['Graphics and titles complete', graphics, setGraphics],
    ['Captions complete', captions, setCaptions],
  ] as const

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Post-production</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tracks finishing work and stores the approved master as a versioned artifact.</p>
        </div>
        {latest ? <Badge variant="outline">Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}</Badge> : null}
      </div>

      {masterUrl ? <div className="mt-4 rounded-md bg-muted/40 p-4 text-sm"><a className="underline" href={masterUrl} target="_blank" rel="noreferrer">Open Post-production Master</a></div> : null}

      <div className="mt-4 space-y-3">
        {!runId ? <Button onClick={startRun} disabled={pending || !props.canStart}>{pending ? 'Starting…' : latest ? 'Start revision run' : 'Start Post-production'}</Button> : (
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">Active run: {runId}</div>
            <div className="grid gap-2 rounded-md bg-muted/40 p-4">
              {checks.map(([label, checked, setter]) => (
                <label key={label} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={(event) => setter(event.target.checked)} disabled={pending} />
                  {label}
                </label>
              ))}
            </div>
            <Input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Provider or editor" disabled={pending} />
            <Input value={workflow} onChange={(event) => setWorkflow(event.target.value)} placeholder="Editing workflow or software" disabled={pending} />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Final master URL" disabled={pending} />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional finishing notes" disabled={pending} />
            <div className="flex justify-end"><Button onClick={registerMaster} disabled={pending}>{pending ? 'Saving…' : 'Register Post-production Master'}</Button></div>
          </div>
        )}
      </div>

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Approval note or revision details" disabled={pending} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve Post-production Master</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
