'use client'

import { useState, useTransition } from 'react'
import { decideResearchVersion, generateResearch } from '@/app/actions/research'
import type { ResearchVersionView } from '@/app/actions/research'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface ResearchPanelProps {
  projectId: string
  productionId: string
  canGenerate: boolean
  versions: ResearchVersionView[]
}

export function ResearchPanel(props: ResearchPanelProps) {
  const latest = props.versions[0] ?? null
  const body = typeof latest?.content?.body === 'string' ? latest.content.body : ''
  const decision = latest?.approval?.decision ?? null
  const [instruction, setInstruction] = useState('')
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateResearch({
        projectId: props.projectId,
        productionId: props.productionId,
        revisionInstruction: instruction,
      })
      if (!result.success) return toast.error(result.error)
      setInstruction('')
      toast.success(`Research version ${result.data.version_number} generated.`)
    })
  }

  function handleDecision(nextDecision: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideResearchVersion({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: latest.id,
        decision: nextDecision,
        comment,
      })
      if (!result.success) return toast.error(result.error)
      setComment('')
      toast.success(nextDecision === 'approved' ? 'Research approved.' : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Research</h2>
          <p className="mt-1 text-sm text-muted-foreground">Requires an approved Brief.</p>
        </div>
        {latest ? (
          <Badge variant="outline">
            Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}
          </Badge>
        ) : null}
      </div>

      {body ? (
        <div className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm">
          {body}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <Textarea
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="Optional Research focus or revision instruction"
          disabled={isPending || !props.canGenerate}
        />
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={isPending || !props.canGenerate}>
            {isPending ? 'Generating…' : latest ? 'Generate new version' : 'Generate Research'}
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
              Approve Research
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
