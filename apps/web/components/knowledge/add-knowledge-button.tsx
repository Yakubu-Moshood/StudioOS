'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddKnowledgeDialog } from './add-knowledge-dialog'

interface AddKnowledgeButtonProps {
  projectId: string
}

export function AddKnowledgeButton({ projectId }: AddKnowledgeButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Entry
      </Button>
      <AddKnowledgeDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  )
}
