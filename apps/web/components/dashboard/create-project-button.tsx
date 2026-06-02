'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from './create-project-dialog'

export function CreateProjectButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>New project</Button>
      <CreateProjectDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
