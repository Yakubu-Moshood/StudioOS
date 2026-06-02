'use client'

import { useState, useTransition } from 'react'
import { addSection } from '@/app/actions/compass'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { SectionType } from '@studioos/shared'

const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'custom',           label: 'Custom'           },
  { value: 'visual_language',  label: 'Visual Language'  },
  { value: 'tone_atmosphere',  label: 'Tone & Atmosphere' },
  { value: 'influences',       label: 'Influences'       },
  { value: 'what_this_is_not', label: 'What This Is Not' },
]

interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function AddSectionDialog({ open, onOpenChange, projectId }: AddSectionDialogProps) {
  const [sectionType, setSectionType] = useState<SectionType>('custom')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setSectionType('custom')
    setTitle('')
    setContent('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    startTransition(async () => {
      const result = await addSection({
        projectId,
        title,
        content,
        sectionType,
      })

      if (result.success) {
        toast.success('Section added.')
        reset()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) { reset(); onOpenChange(o) } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-type">Type</Label>
            <select
              id="section-type"
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value as SectionType)}
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {SECTION_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section title"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section-content">Content <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="section-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe this aspect of your creative vision…"
              rows={4}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false) }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? 'Adding…' : 'Add Section'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
