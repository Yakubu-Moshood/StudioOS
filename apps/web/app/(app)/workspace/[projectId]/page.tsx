import { redirect } from 'next/navigation'

interface WorkspacePageProps {
  params: Promise<{ projectId: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params
  redirect(`/workspace/${projectId}/core`)
}
