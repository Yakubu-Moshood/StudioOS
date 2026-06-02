'use client'

import { useState } from 'react'
import { Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddReferenceDialog } from './add-reference-dialog'

interface AddReferenceButtonProps {
  projectId: string
}

export function AddReferenceButton({ projectId }: AddReferenceButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Link className="mr-1.5 h-4 w-4" />
        Add Reference
      </Button>
      <AddReferenceDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
      />
    </>
  )
}
