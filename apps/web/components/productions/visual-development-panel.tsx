'use client'

import { useState, useTransition } from 'react'
import { decideVisualDevelopment, generateVisualDevelopment } from '@/app/actions/visual-development'
import type { CreativeStageVersion } from '@/app/actions/creative-stages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function VisualDevelopmentPanel(props: {
  projectId: string
  productionId: string
  canGenerate: boolean
  versions: CreativeStageVersion[]
}) {
  const latest = props.versions[0] ?? null
  const body = typeof latest?.content?.body === 'string' ? latest.content.body : ''
  const decision = latest?.approval?.decision ?? null
  const [instruction, setInstruction] = useState('')
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()

  function generateVisuals() {
    startTransition(async () => {
      const result = await generateVisualDevelopment({
        projectId: props.projectId,
        productionId: props.productionId,
        instruction,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setInstruction('')
      toast.success(`Visual Development version ${result.data.version_number} generated.`)
    })
  }

  function decide(value: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideVisualDevelopment({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: latest.id,
        decision: value,
        comment,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setComment('')
      toast.success(value === 'approved' ? 'Visual Development approved.' : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Visual Development</h2>
          <p className="mt-1 text-sm text-muted-foreground">Defines the campaign’s visual language before Storyboard.</p>
        </div>
        {latest ? (
          <Badge variant="outline">
            Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}
          </Badge>
        ) : null}
      </div>

      {body ? (
        <div className="mt-4 max-h-[42rem] overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">{body}</div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {['Visual North Star', 'Colour and Lighting', 'Production Design', 'Casting and Wardrobe', 'Camera Language', 'Typography and Graphics', 'Location Direction', 'Reference Image Briefs', 'Continuity Guardrails'].map((item) => (
            <div key={item} className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">{item}</div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Optional visual direction or revision instruction"
          disabled={pending || !props.canGenerate}
        />
        <div className="flex justify-end">
          <Button onClick={generateVisuals} disabled={pending || !props.canGenerate}>
            {pending ? 'Generating…' : latest ? 'Generate new version' : 'Generate Visual Development'}
          </Button>
        </div>
      </div>

      {latest && decision === null ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional approval note or revision details"
            disabled={pending}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve Visual Development</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
