'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadDialog } from './upload-dialog'

interface UploadButtonProps {
  projectId: string
  userId: string
}

export function UploadButton({ projectId, userId }: UploadButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" />
        Upload
      </Button>
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        userId={userId}
      />
    </>
  )
}
