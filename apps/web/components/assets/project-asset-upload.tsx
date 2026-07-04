'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { addProjectAsset } from '@/app/actions/project-assets'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const BUCKET_NAME = 'project-assets'

interface ProjectAssetUploadProps {
  projectId: string
}

function safeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ProjectAssetUpload({ projectId }: ProjectAssetUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const disabled = uploading || isPending

  async function uploadFile(file: File) {
    setUploading(true)
    const supabase = createClient()
    const storagePath = `projects/${projectId}/${Date.now()}-${safeFileName(file.name)}`

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      setUploading(false)
      toast.error(error.message)
      return
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

    startTransition(async () => {
      const result = await addProjectAsset({
        projectId,
        fileName: file.name,
        fileUrl: data.publicUrl,
        storagePath,
        contentType: file.type || null,
        fileSize: file.size,
      })

      setUploading(false)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Project asset uploaded.')
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#cbded8] bg-[#f8fbfa] p-5">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void uploadFile(file)
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Upload project asset</h2>
          <p className="mt-1 text-sm text-[#667780]">
            Add reusable files like brand assets, scripts, research docs, logos, images, audio, and PDFs.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {disabled ? 'Uploading…' : 'Choose file'}
        </Button>
      </div>
    </div>
  )
}
