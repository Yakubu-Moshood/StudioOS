'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface BriefVersionView extends ArtifactVersion {
  approval: Approval | null
}

export async function getBriefVersions(productionId: string): Promise<BriefVersionView[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'brief').maybeSingle()
  if (artifactError) throw new Error('Failed to load Brief artifact.')
  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load Brief versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function createBriefVersion(input: {
  projectId: string
  productionId: string
  content: string | Record<string, unknown>
}): Promise<ActionResult<ArtifactVersion>> {
  const briefContent = typeof input.content === 'string'
    ? { body: input.content.trim() }
    : input.content

  if (typeof input.content === 'string' && !input.content.trim()) {
    return { success: false, error: 'Brief content is required.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('create_brief_version', {
    target_production_id: input.productionId,
    brief_content: briefContent,
  })
  if (error || !data) return { success: false, error: 'Failed to save Brief version.' }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decideBriefVersion(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<ActionResult<Approval>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('decide_brief_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: 'Failed to record Brief decision.' }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
