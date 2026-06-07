'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddBlockDialog } from './add-block-dialog'

interface AddBlockButtonProps {
  projectId: string
}

export function AddBlockButton({ projectId }: AddBlockButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Block
      </Button>
      <AddBlockDialog open={open} onOpenChange={setOpen} projectId={projectId} />
    </>
  )
}
