'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAsset } from '@/app/actions/assets'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { AssetType } from '@studioos/shared'

const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

function inferAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/'))       return 'image'
  if (mimeType.startsWith('video/'))       return 'video'
  if (mimeType.startsWith('audio/'))       return 'audio'
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  )                                        return 'document'
  return 'other'
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  userId: string
}

export function UploadDialog({ open, onOpenChange, projectId, userId }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    if (!selected) return

    if (selected.size > MAX_SIZE_BYTES) {
      toast.error('File exceeds the 50 MB limit.')
      return
    }

    setFile(selected)
    setName(selected.name.replace(/\.[^.]+$/, ''))
  }

  function reset() {
    setFile(null)
    setName('')
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name.trim()) return

    startTransition(async () => {
      const assetId = crypto.randomUUID()
      const storagePath = `${userId}/${projectId}/${assetId}/${file.name}`
      const supabase = createClient()

      const { error: storageError } = await supabase.storage
        .from('assets')
        .upload(storagePath, file)

      if (storageError) {
        toast.error('Upload failed. Please try again.')
        return
      }

      const result = await uploadAsset({
        projectId,
        assetId,
        storagePath,
        name: name.trim(),
        type: inferAssetType(file.type),
        mimeType: file.type || null,
        size: file.size,
      })

      if (result.success) {
        toast.success('Asset uploaded.')
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
          <DialogTitle>Upload Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-file">File</Label>
            <Input
              id="asset-file"
              ref={inputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">Maximum file size: 50 MB</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="asset-name">Name</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Asset name"
              disabled={isPending}
              required
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
            <Button type="submit" disabled={!file || !name.trim() || isPending}>
              {isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
