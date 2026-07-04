'use client'

import { useState, useTransition } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateSection, deleteSection, reorderSection } from '@/app/actions/compass'
import { toast } from 'sonner'
import type { CompassSection, SectionType } from '@studioos/shared'

const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'custom',           label: 'Custom'           },
  { value: 'visual_language',  label: 'Visual Language'  },
  { value: 'tone_atmosphere',  label: 'Tone & Atmosphere' },
  { value: 'influences',       label: 'Influences'       },
  { value: 'what_this_is_not', label: 'What This Is Not' },
]

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  custom:           'Custom',
  visual_language:  'Visual Language',
  tone_atmosphere:  'Tone & Atmosphere',
  influences:       'Influences',
  what_this_is_not: 'What This Is Not',
}

interface SectionCardProps {
  section: CompassSection
  projectId: string
  isFirst: boolean
  isLast: boolean
}

export function SectionCard({ section, projectId, isFirst, isLast }: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(section.title)
  const [editContent, setEditContent] = useState(section.content)
  const [editType, setEditType] = useState<SectionType>(section.section_type)
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    setEditTitle(section.title)
    setEditContent(section.content)
    setEditType(section.section_type)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    if (!editTitle.trim()) return
    startTransition(async () => {
      const result = await updateSection({
        sectionId: section.id,
        projectId,
        title: editTitle,
        content: editContent,
        sectionType: editType,
      })
      if (result.success) {
        toast.success('Section updated.')
        setIsEditing(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSection({ sectionId: section.id, projectId })
      if (result.success) {
        toast.success('Section deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleReorder(direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderSection({ sectionId: section.id, projectId, direction })
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[#dce6e2] bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`type-${section.id}`}>Type</Label>
          <select
            id={`type-${section.id}`}
            value={editType}
            onChange={(e) => setEditType(e.target.value as SectionType)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {SECTION_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`title-${section.id}`}>Title</Label>
          <Input
            id={`title-${section.id}`}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`content-${section.id}`}>Content</Label>
          <Textarea
            id={`content-${section.id}`}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            disabled={isPending}
            className="resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!editTitle.trim() || isPending}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col gap-3 rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Badge variant="outline" className="w-fit shrink-0 border-[#cbded8] bg-[#f3faf7] text-xs text-[#2f7f73]">
            {SECTION_TYPE_LABELS[section.section_type]}
          </Badge>
          <h3 className="text-base font-semibold leading-snug tracking-[-0.02em] text-[#0f2433]">{section.title}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleReorder('up')}
            disabled={isFirst || isPending}
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleReorder('down')}
            disabled={isLast || isPending}
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleEdit}
            disabled={isPending}
            title="Edit section"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {section.content && (
        <p className="whitespace-pre-wrap text-sm leading-7 text-[#667780]">
          {section.content}
        </p>
      )}
    </div>
  )
}
