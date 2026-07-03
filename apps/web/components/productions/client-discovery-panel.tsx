'use client'

import { useMemo, useState, useTransition } from 'react'
import { createBriefVersion, decideBriefVersion } from '@/app/actions/briefs'
import type { BriefVersionView } from '@/app/actions/briefs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const fields = [
  ['business_problem', 'Business problem'],
  ['client_brief', 'Client brief'],
  ['brand_guidelines', 'Brand guidelines'],
  ['product_information', 'Product information'],
  ['existing_campaigns', 'Existing campaigns'],
  ['competitors', 'Competitors'],
  ['budget', 'Budget'],
  ['timeline', 'Timeline'],
  ['deliverables', 'Deliverables'],
  ['target_audience', 'Target audience'],
  ['mandatory_messaging', 'Mandatory messaging'],
] as const

type FieldKey = (typeof fields)[number][0]
type FormState = Record<FieldKey, string>

function readInitial(version: BriefVersionView | null): FormState {
  const discovery = (version?.content?.client_discovery ?? {}) as Record<string, unknown>
  return Object.fromEntries(fields.map(([key]) => [key, typeof discovery[key] === 'string' ? discovery[key] : ''])) as FormState
}

export function ClientDiscoveryPanel(props: {
  projectId: string
  productionId: string
  versions: BriefVersionView[]
}) {
  const latest = props.versions[0] ?? null
  const [form, setForm] = useState<FormState>(() => readInitial(latest))
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const decision = latest?.approval?.decision ?? null
  const awaiting = latest !== null && decision === null
  const complete = useMemo(() => fields.every(([key]) => form[key].trim()), [form])

  function save() {
    const creativeBrief = `${form.business_problem}\n\nAudience: ${form.target_audience}\n\nMandatory message: ${form.mandatory_messaging}`
    const projectCharter = `Deliverables: ${form.deliverables}\nTimeline: ${form.timeline}\nBudget: ${form.budget}`
    const successMetrics = `Success will be measured against the business problem, audience response and delivery requirements defined in Client Discovery.`
    const riskRegister = `Key risks to manage: brand compliance, budget, timeline, competitor similarity, mandatory-message accuracy and deliverable scope.`

    startTransition(async () => {
      const result = await createBriefVersion({
        projectId: props.projectId,
        productionId: props.productionId,
        content: {
          type: 'advertising_client_discovery',
          client_discovery: form,
          outputs: {
            creative_brief: creativeBrief,
            project_charter: projectCharter,
            success_metrics: successMetrics,
            risk_register: riskRegister,
          },
        },
      })
      if (!result.success) return toast.error(result.error)
      toast.success(`Client Discovery version ${result.data.version_number} saved.`)
    })
  }

  function decide(next: 'approved' | 'revision_requested') {
    if (!latest) return
    startTransition(async () => {
      const result = await decideBriefVersion({
        projectId: props.projectId,
        productionId: props.productionId,
        artifactVersionId: latest.id,
        decision: next,
        comment,
      })
      if (!result.success) return toast.error(result.error)
      setComment('')
      toast.success(next === 'approved' ? 'Client Discovery approved.' : 'Revision requested.')
    })
  }

  const outputs = (latest?.content?.outputs ?? {}) as Record<string, unknown>

  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Client Discovery</h2>
          <p className="mt-1 text-sm text-muted-foreground">Understand the business problem before developing ideas.</p>
        </div>
        {latest ? <Badge variant="outline">Version {latest.version_number} · {decision?.replace('_', ' ') ?? 'awaiting approval'}</Badge> : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <div key={key} className={key === 'client_brief' || key === 'business_problem' ? 'md:col-span-2' : ''}>
            <Label htmlFor={key}>{label}</Label>
            {key === 'budget' || key === 'timeline' ? (
              <Input id={key} className="mt-1.5" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} disabled={pending} />
            ) : (
              <Textarea id={key} className="mt-1.5 min-h-24" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} disabled={pending} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={pending || !complete}>{latest ? 'Save new version' : 'Save Client Discovery'}</Button>
      </div>

      {latest ? (
        <div className="mt-5 border-t pt-5">
          <h3 className="text-sm font-medium">Generated outputs</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[
              ['Creative Brief', outputs.creative_brief],
              ['Project Charter', outputs.project_charter],
              ['Success Metrics', outputs.success_metrics],
              ['Risk Register', outputs.risk_register],
            ].map(([title, body]) => (
              <div key={title as string} className="rounded-md bg-muted/40 p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{typeof body === 'string' ? body : 'Not generated yet.'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {awaiting ? (
        <div className="mt-5 space-y-3 border-t pt-5">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional approval note or revision details" disabled={pending} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => decide('revision_requested')} disabled={pending}>Request revision</Button>
            <Button onClick={() => decide('approved')} disabled={pending}>Approve Client Discovery</Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
