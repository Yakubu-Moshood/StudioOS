import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, PackageCheck, Plus, Sparkles, Workflow } from 'lucide-react'
import { getProjects } from '@/app/actions/projects'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { ProjectFilter } from '@/components/dashboard/project-filter'
import { CreateProjectButton } from '@/components/dashboard/create-project-button'
import type { ProjectFilterValue } from '@/components/dashboard/project-filter'

export const metadata: Metadata = {
  title: 'Dashboard — FraymIQ Platform',
}

interface DashboardPageProps {
  searchParams: Promise<{ filter?: string }>
}

interface WorkflowCard {
  label: string
  status: string
  Icon: LucideIcon
}

interface StatCard {
  value: string | number
  label: string
  Icon: LucideIcon
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { filter: rawFilter } = await searchParams
  const filter: ProjectFilterValue =
    rawFilter === 'archived' ? 'archived' : rawFilter === 'all' ? 'all' : 'active'

  const projects = await getProjects(filter)
  const activeProjects = projects.filter((project) => project.archived_at === null).length

  const workflowCards: WorkflowCard[] = [
    { label: 'Brief', status: 'Completed', Icon: CheckCircle2 },
    { label: 'Production', status: 'Active', Icon: Workflow },
    { label: 'Delivery', status: 'Ready', Icon: PackageCheck },
    { label: 'Package', status: 'Final gate', Icon: ArrowRight },
  ]

  const statCards: StatCard[] = [
    { value: activeProjects, label: 'Active projects', Icon: FolderKanban },
    { value: projects.length, label: 'Projects loaded', Icon: Workflow },
    { value: '15', label: 'Workflow stages', Icon: CheckCircle2 },
    { value: '3', label: 'Run recovery gates', Icon: Clock3 },
  ]

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[#e1e7e4] bg-white/80 p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#2f7f73]">FraymIQ Platform</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-[#0f2433] sm:text-5xl">
            Welcome back. Let&apos;s move production forward.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#667780]">
            Manage projects, productions, approvals, and final packages from one clear creative workflow.
          </p>
          <div className="mt-7">
            <CreateProjectButton />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-[#e1e7e4] bg-white/80 p-8 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#e8f2ee]" />
          <div className="absolute bottom-0 right-0 h-40 w-64 rounded-tl-[5rem] bg-[#edf3f8]" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#2f7f73]">Current workflow</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0f2433]">Advertising Campaign</h2>
              </div>
              <span className="rounded-full bg-[#e8f2ee] px-3 py-1 text-xs font-medium text-[#2f7f73]">MVP Ready</span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {workflowCards.map(({ label, status, Icon }) => (
                <div key={label} className="rounded-2xl border border-[#e1e7e4] bg-white/85 p-4 shadow-sm">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f2ee] text-[#2f7f73]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-[#0f2433]">{label}</p>
                  <p className="mt-1 text-xs text-[#667780]">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {statCards.map(({ value, label, Icon }) => (
          <div key={label} className="rounded-3xl border border-[#e1e7e4] bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-[#0f2433]">{value}</p>
                <p className="mt-1 text-sm text-[#667780]">{label}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] border border-[#e1e7e4] bg-white/85 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#0f2433]">Projects</h2>
            <p className="mt-1 text-sm text-[#667780]">Open a project to create or continue a production.</p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectFilter activeFilter={filter} />
            <div className="hidden sm:block">
              <CreateProjectButton />
            </div>
          </div>
        </div>
        <ProjectGrid projects={projects} filter={filter} />
      </section>

      <section className="mt-6 rounded-[2rem] border border-[#d9e7e2] bg-[#e8f2ee] p-5 text-[#0f2433]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#2f7f73]"><Plus className="h-5 w-5" /></div>
            <div>
              <p className="font-medium">Next focus</p>
              <p className="text-sm text-[#55706b]">Create a fresh smoke-test project whenever we need to verify a new workflow change.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
