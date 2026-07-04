import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface AssetsPageProps {
  params: Promise<{ projectId: string }>
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  await params

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Project library
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Assets</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Store reusable project files such as brand materials, research documents, logos, scripts, images, audio, and references.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b9d8c8] bg-[#f0f8f3] text-[#235c43]">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
        <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Asset library</h2>
        <p className="mt-1 text-sm text-[#667780]">
          Project Assets foundation is active. Upload and listing will be added back after this shell deploys cleanly.
        </p>

        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Assets page shell is ready.
        </div>
      </section>
    </div>
  )
}
