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
}> = [
  {
    value: 'advertising_campaign',
    label: 'Advertising Campaign',
    description: 'Campaign strategy, concepts, scripts, visual development and delivery.',
  },
  {
    value: 'documentary',
    label: 'Documentary',
    description: 'Research-led documentary or YouTube documentary production.',
  },
  {
    value: 'explainer_video',
    label: 'Explainer Video',
    description: 'Clear educational, product or service explanation.',
  },
  {
    value: 'custom',
    label: 'Custom Production',
    description: 'Use the basic workflow for a production that does not fit the templates.',
  },
]

export function CreateProductionForm({ projectId }: CreateProductionFormProps) {
  const [title, setTitle] = useState('')
  const [productionType, setProductionType] = useState<ProductionType>('documentary')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="production-title">Production title</Label>
        <Input
          id="production-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. EmpireOmitted Episode 6"
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
        <p className="text-sm text-muted-foreground">
          {productionTypes.find((type) => type.value === productionType)?.description}
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || title.trim().length === 0}>
          {isPending ? 'Creating…' : 'Create production'}
        </Button>
      </div>
    </form>
  )
}
