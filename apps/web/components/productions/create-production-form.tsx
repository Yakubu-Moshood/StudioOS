'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProduction } from '@/app/actions/productions'
import type { ProductionType } from '@studioos/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface CreateProductionFormProps {
  projectId: string
}

const productionTypes: Array<{
  value: ProductionType
  label: string
  description: string
  guidance: string
}> = [
  {
    value: 'advertising_campaign',
    label: 'Advertising Campaign',
    description: 'Campaign strategy, concepts, scripts, visual development and delivery.',
    guidance: 'Best first choice for the launch workflow because it already has the full guided production path.',
  },
  {
    value: 'documentary',
    label: 'Documentary',
    description: 'Research-led documentary or YouTube documentary production.',
    guidance: 'Use this when the output is mainly a story, investigation, or documentary episode.',
  },
  {
    value: 'explainer_video',
    label: 'Explainer Video',
    description: 'Clear educational, product or service explanation.',
    guidance: 'Use this for short, direct videos that explain a topic, offer, or process.',
  },
  {
    value: 'custom',
    label: 'Custom Production',
    description: 'Use the basic workflow for a production that does not fit the templates.',
    guidance: 'Use this only when the other production types do not fit the work.',
  },
]

export function CreateProductionForm({ projectId }: CreateProductionFormProps) {
  const [title, setTitle] = useState('')
  const [productionType, setProductionType] = useState<ProductionType>('advertising_campaign')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const selectedType = productionTypes.find((type) => type.value === productionType)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const result = await createProduction({ projectId, title, productionType })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setTitle('')
      toast.success('Production created.')
      router.push(`/workspace/${projectId}/productions/${result.data.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.25rem] border border-[#dce6e2] bg-white/80 p-4 shadow-sm">
      <div className="rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-4">
        <p className="text-sm font-semibold text-[#0f2433]">Start simple</p>
        <p className="mt-1 text-sm leading-6 text-[#667780]">
          Give the production a clear title and choose the workflow type. For a first test, use Advertising Campaign.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="production-title">Production title</Label>
        <Input
          id="production-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. EmpireOmitted Launch Campaign"
          disabled={isPending}
          maxLength={160}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="production-type">Production type</Label>
        <select
          id="production-type"
          value={productionType}
          onChange={(event) => setProductionType(event.target.value as ProductionType)}
          disabled={isPending}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {productionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <div className="rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-3 text-sm leading-6 text-[#667780]">
          <p>{selectedType?.description}</p>
          <p className="mt-1 font-medium text-[#2f7f73]">{selectedType?.guidance}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || title.trim().length === 0}>
          {isPending ? 'Creating…' : 'Create production'}
        </Button>
      </div>
    </form>
  )
}
