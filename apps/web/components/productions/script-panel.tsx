'use client'

import { useState, useTransition } from 'react'
import { decideScriptVersion, generateScript } from '@/app/actions/scripts'
import type { ScriptVersionView } from '@/app/actions/scripts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ScriptPanelProps {
  projectId: string
  productionId: string
  canGenerate: boolean
  versions: ScriptVersionView[]
  mode?: 'script' | 'advertising_script'
}

export function ScriptPanel(props: ScriptPanelProps) {
  const latest = props.versions[0] ?? null
  const body = typeof latest?.content?.body === 'string' ? latest.content.body : ''
  const decision = latest?.approval?.decision ?? null
  const [instruction, setInstruction] = useState('')
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const advertising = props.mode === 'advertising_script'

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateScript({
        projectId: props.projectId,
        productionId: props.productionId,
        revisionInstruction: instruction,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setInstruction('')
      toast.success(`${advertising ? 'Advertising Script' : 'Script'} version ${result.data.version_number} generated.`)
    })
  }

  function handleDecision(nextDecision: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideScriptVersion({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: latest.id,
        decision: nextDecision,
        comment,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setComment('')
      toast.success(nextDecision === 'approved'
        ? `${advertising ? 'Advertising Script' : 'Script'} approved.`
        : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">{advertising ? 'Script Development' : 'Script'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {advertising
              ? 'Turns the approved campaign concept into a timed hero-film script and cutdown plan.'
              : 'Requires approved Brief and Research versions.'}
          </p>
        </div>
        {latest ? (
          <Badge variant="outline">
            Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}
          </Badge>
        ) : null}
      </div>

      {body ? (
        <div className="mt-4 max-h-[42rem] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">
          {body}
        </div>
      ) : advertising ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Script Title', 'Duration and Format', 'Scene-by-Scene Script', 'Voiceover and Dialogue', 'On-Screen Text', 'End Frame and CTA', '15-Second Cutdown Notes'].map((item) => (
            <div key={item} className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">{item}</div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={advertising ? 'Optional script direction or revision instruction' : 'Optional Script focus or revision instruction'}
          disabled={isPending || !props.canGenerate}
        />
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={isPending || !props.canGenerate}>
            {isPending
              ? 'Generating…'
              : latest
                ? 'Generate new version'
                : advertising
                  ? 'Generate Advertising Script'
                  : 'Generate Script'}
          </Button>
        </div>
      </div>

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional decision note"
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleDecision('revision_requested')} disabled={isPending}>
              Request revision
            </Button>
            <Button onClick={() => handleDecision('approved')} disabled={isPending}>
              Approve {advertising ? 'Advertising Script' : 'Script'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
