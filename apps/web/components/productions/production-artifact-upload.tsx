'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const BUCKET_NAME = 'production-artifacts'

type ArtifactKind = 'generated-video' | 'post-production-master' | 'delivery-package'

interface ProductionArtifactUploadProps {
  productionId: string
  artifactKind: ArtifactKind
  disabled?: boolean
  onUploaded: (url: string) => void
}

function safeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ProductionArtifactUpload({ productionId, artifactKind, disabled = false, onUploaded }: ProductionArtifactUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    const supabase = createClient()
    const filePath = `productions/${productionId}/${artifactKind}/${Date.now()}-${safeFileName(file.name)}`

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      setUploading(false)
      toast.error(error.message)
      return
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
    onUploaded(data.publicUrl)
    setUploading(false)
    toast.success('File uploaded. The URL field has been filled in.')
  }

  return (
    <div className="rounded-md border border-dashed bg-muted/20 p-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void uploadFile(file)
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Upload file</p>
          <p className="text-xs text-muted-foreground">Or paste an external URL in the field below.</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading…' : 'Choose file'}
        </Button>
      </div>
    </div>
  )
}
