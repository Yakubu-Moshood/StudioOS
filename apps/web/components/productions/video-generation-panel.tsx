'use client'

import { useState, useTransition } from 'react'
import { decideGeneratedVideo, registerGeneratedVideo, startVideoGeneration, type VideoGenerationVersion } from '@/app/actions/video-generation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProductionArtifactUpload } from '@/components/productions/production-artifact-upload'
import { toast } from 'sonner'

export function VideoGenerationPanel(props: { projectId: string; productionId: string; canStart: boolean; versions: VideoGenerationVersion[]; activeRunId?: string | null }) {
  const latest = props.versions[0] ?? null
  const content = latest?.content as Record<string, unknown> | undefined
  const outputUrl = typeof content?.video_url === 'string' ? content.video_url : ''
  const decision = latest?.approval?.decision ?? null
  const [runId, setRunId] = useState(props.activeRunId ?? '')
  const [provider, setProvider] = useState('manual')
  const [model, setModel] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()

  function startRun() {
    startTransition(async () => {
      const result = await startVideoGeneration({ projectId: props.projectId, productionId: props.productionId })
      if (!result.success) return void toast.error(result.error)
      setRunId(result.data.id)
      toast.success('Video Generation run started.')
    })
  }

  function registerOutput() {
    if (!runId || !url.trim() || !provider.trim()) return void toast.error('Run, provider and output URL are required.')
    startTransition(async () => {
      const result = await registerGeneratedVideo({ projectId: props.projectId, productionId: props.productionId, runId, outputUrl: url, provider, model, notes })
      if (!result.success) return void toast.error(result.error)
      setRunId('')
      setUrl('')
      setNotes('')
      toast.success(`Generated Video version ${result.data.version_number} registered.`)
    })
  }

  function decide(value: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideGeneratedVideo({ projectId: props.projectId, productionId: props.productionId, artifactVersionId: latest.id, decision: value, comment })
      if (!result.success) return void toast.error(result.error)
      setComment('')
      toast.success(value === 'approved' ? 'Generated Video approved.' : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Video Generation</h2>
          <p className="mt-1 text-sm text-muted-foreground">Creates a tracked Job and Run, then stores the generated video as a versioned artifact.</p>
        </div>
        {latest ? <Badge variant="outline">Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}</Badge> : null}
      </div>

      {outputUrl ? <div className="mt-4 rounded-md bg-muted/40 p-4 text-sm"><a className="underline" href={outputUrl} target="_blank" rel="noreferrer">Open generated video</a></div> : null}

      <div className="mt-4 space-y-3">
        {!runId ? <Button onClick={startRun} disabled={pending || !props.canStart}>{pending ? 'Starting…' : latest ? 'Start retry run' : 'Start Video Generation'}</Button> : (
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">Active run recovered: {runId}</div>
            <Input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Provider, for example Runway" disabled={pending} />
            <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model or workflow name" disabled={pending} />
            <ProductionArtifactUpload productionId={props.productionId} artifactKind="generated-video" disabled={pending} onUploaded={setUrl} />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Generated video URL" disabled={pending} />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional generation notes" disabled={pending} />
            <div className="flex justify-end"><Button onClick={registerOutput} disabled={pending}>{pending ? 'Saving…' : 'Register generated video'}</Button></div>
          </div>
        )}
      </div>

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Approval note or revision details" disabled={pending} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve Generated Video</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
