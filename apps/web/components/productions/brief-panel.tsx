'use client'

import { useState, useTransition } from 'react'
import { createBriefVersion, decideBriefVersion } from '@/app/actions/briefs'
import type { BriefVersionView } from '@/app/actions/briefs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface BriefPanelProps {
  projectId: string
  productionId: string
  versions: BriefVersionView[]
}

export function BriefPanel({ projectId, productionId, versions }: BriefPanelProps) {
  const latest = versions[0] ?? null
  const latestBody = typeof latest?.content?.body === 'string' ? latest.content.body : ''
  const [content, setContent] = useState(latestBody)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  const latestDecision = latest?.approval?.decision ?? null
  const isAwaitingDecision = latest !== null && latestDecision === null

  function saveVersion() {
    startTransition(async () => {
      const result = await createBriefVersion({ projectId, productionId, content })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(`Brief version ${result.data.version_number} saved.`)
    })
  }

  function decide(decision: 'approved' | 'revision_requested') {
    if (!latest) return

    startTransition(async () => {
      const result = await decideBriefVersion({
        projectId,
        productionId,
        artifactVersionId: latest.id,
        decision,
        comment,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setComment('')
      toast.success(decision === 'approved' ? 'Brief approved.' : 'Revision requested.')
    })
  }

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Production Brief</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every save creates a new immutable version.
          </p>
        </div>
        {latest && (
          <Badge variant="outline">
            Version {latest.version_number}
            {latestDecision ? ` · ${latestDecision.replace('_', ' ')}` : ' · awaiting approval'}
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Describe the production goal, audience, format, tone, required outputs and constraints."
          className="min-h-48"
          disabled={isPending}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={saveVersion}
            disabled={isPending || content.trim().length === 0 || content.trim() === latestBody.trim()}
          >
            {latest ? 'Save new version' : 'Save Brief'}
          </Button>
        </div>
      </div>

      {isAwaitingDecision && (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Optional approval note or required revision details"
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => decide('revision_requested')}
              disabled={isPending}
            >
              Request revision
            </Button>
            <Button type="button" onClick={() => decide('approved')} disabled={isPending}>
              Approve Brief
            </Button>
          </div>
        </div>
      )}

      {versions.length > 1 && (
        <div className="mt-5 border-t pt-5">
          <h3 className="text-sm font-medium">Version history</h3>
          <div className="mt-3 grid gap-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <span>Version {version.version_number}</span>
                <span className="text-xs text-muted-foreground">
                  {version.approval?.decision.replace('_', ' ') ?? 'awaiting approval'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
