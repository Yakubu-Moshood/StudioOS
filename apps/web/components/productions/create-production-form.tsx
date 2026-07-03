'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProduction } from '@/app/actions/productions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface CreateProductionFormProps {
  projectId: string
}

export function CreateProductionForm({ projectId }: CreateProductionFormProps) {
  const [title, setTitle] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    startTransition(async () => {
      const result = await createProduction({ projectId, title })
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
    <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-lg border p-4">
      <div className="flex-1 space-y-1.5">
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
      <Button type="submit" disabled={isPending || title.trim().length === 0}>
        {isPending ? 'Creating…' : 'Create production'}
      </Button>
    </form>
  )
}
