'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddSectionDialog } from './add-section-dialog'

interface AddSectionButtonProps {
  projectId: string
}

export function AddSectionButton({ projectId }: AddSectionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Section
      </Button>
      <AddSectionDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  )
}
