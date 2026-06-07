'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { restoreProject } from '@/app/actions/projects'
import { toast } from 'sonner'

interface ArchivedProjectBannerProps {
  projectId: string
}

export function ArchivedProjectBanner({ projectId }: ArchivedProjectBannerProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreProject({ projectId })
      if (result.success) {
        toast.success('Project restored.')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <Archive className="h-4 w-4 shrink-0" />
        <span>This project is archived.</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={isPending}
        className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
      >
        {isPending ? 'Restoring…' : 'Restore Project'}
      </Button>
    </div>
  )
}
