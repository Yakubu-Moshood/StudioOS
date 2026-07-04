import Link from 'next/link'
import { ArrowRight, BookOpen, Compass, GitBranch, Layers, Sparkles, Clapperboard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProjectCore } from '@/app/actions/core'
import { CoreForm } from './core-form'

interface CoreViewProps {
  projectId: string
}

const WORKSPACE_GUIDE = [
  { title: 'Core', description: 'Project foundation, tone, genre, themes, and synopsis.', icon: Layers },
  { title: 'Compass', description: 'Creative direction and guiding decisions.', icon: Compass },
  { title: 'Map', description: 'Structure for acts, sequences, scenes, beats, and notes.', icon: GitBranch },
  { title: 'AI', description: 'Assistant for project questions and next-step thinking.', icon: Sparkles },
  { title: 'Knowledge', description: 'Research notes, references, and source context.', icon: BookOpen },
  { title: 'Productions', description: 'Executable workflow that turns the project into outputs.', icon: Clapperboard },
] as const

export async function CoreView({ projectId }: CoreViewProps) {
  const core = await getProjectCore(projectId)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
          Project foundation
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Core</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
          Define the project spine: synopsis, genre, tone, and themes. This becomes the base context for future workflow decisions.
        </p>
      </section>

      <section className="rounded-[1.5rem] border border-[#dce6e2] bg-[#f8fbfa] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0f2433]">Next step</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#667780]">
              Once the project core feels clear enough, create your first Production. That is where FraymIQ turns the project into an executable workflow.
            </p>
          </div>
          <Button asChild size="sm" className="w-fit shrink-0">
            <Link href={`/workspace/${projectId}/productions`}>
              Go to Productions
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#0f2433]">Workspace guide</p>
          <p className="mt-1 text-sm leading-6 text-[#667780]">
            Use these sections in a simple order: define the project, shape the direction, map the structure, then create the production workflow.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_GUIDE.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#0f2433]">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[#667780]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <CoreForm projectId={projectId} initialCore={core} />
    </div>
  )
}
