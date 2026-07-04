'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion, Run } from '@studioos/shared'

type Result<T> = { success: true; data: T } | { success: false; error: string }
export type PostProductionVersion = ArtifactVersion & { approval: Approval | null }

export async function getPostProductionVersions(productionId: string): Promise<PostProductionVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'post_production_master').maybeSingle()
  if (!artifact) return []
  const { data, error } = await supabase.from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id).order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load Post-production versions.')
  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function startPostProduction(input: { projectId: string; productionId: string }): Promise<Result<Run>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_post_production_run', { target_production_id: input.productionId })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to start Post-production.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Run }
}

export async function registerPostProductionMaster(input: {
  projectId: string
  productionId: string
  runId: string
  masterUrl: string
  provider: string
  workflow?: string
  notes?: string
  editComplete: boolean
  soundComplete: boolean
  colourComplete: boolean
  graphicsComplete: boolean
  captionsComplete: boolean
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('complete_post_production_run', {
    target_run_id: input.runId,
    master_url: input.masterUrl.trim(),
    provider_name: input.provider.trim(),
    workflow_name: input.workflow?.trim() || null,
    output_metadata: {
      notes: input.notes?.trim() || null,
      checklist: {
        edit: input.editComplete,
        sound: input.soundComplete,
        colour: input.colourComplete,
        graphics: input.graphicsComplete,
        captions: input.captionsComplete,
      },
    },
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to register Post-production Master.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decidePostProductionMaster(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_post_production_master_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to record Post-production decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
