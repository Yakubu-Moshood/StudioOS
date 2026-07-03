'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion, Run } from '@studioos/shared'

type Result<T> = { success: true; data: T } | { success: false; error: string }
export type VideoGenerationVersion = ArtifactVersion & { approval: Approval | null }

export async function getVideoGenerationVersions(productionId: string): Promise<VideoGenerationVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'generated_video').maybeSingle()
  if (!artifact) return []
  const { data, error } = await supabase.from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id).order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load generated videos.')
  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function startVideoGeneration(input: { projectId: string; productionId: string }): Promise<Result<Run>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_video_generation_run', { target_production_id: input.productionId })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to start Video Generation.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Run }
}

export async function registerGeneratedVideo(input: { projectId: string; productionId: string; runId: string; outputUrl: string; provider: string; model?: string; notes?: string }): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('complete_video_generation_run', {
    target_run_id: input.runId,
    video_url: input.outputUrl.trim(),
    provider_name: input.provider.trim(),
    model_name: input.model?.trim() || null,
    output_metadata: { notes: input.notes?.trim() || null },
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to register generated video.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decideGeneratedVideo(input: { projectId: string; productionId: string; artifactVersionId: string; decision: 'approved' | 'revision_requested'; comment?: string }): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_generated_video_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to record video decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
