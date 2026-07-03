'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getShotDesignVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'shot_design')
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Shot Design versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

async function loadLatestBody(productionId: string, artifactType: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', artifactType)
    .maybeSingle()

  if (!artifact) return null

  const { data: version } = await supabase
    .from('artifact_versions')
    .select('content')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const body = (version?.content as Record<string, unknown> | undefined)?.body
  return typeof body === 'string' ? body : null
}

export async function generateShotDesign(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const storyboardBody = await loadLatestBody(input.productionId, 'storyboard')

  if (!storyboardBody) {
    return { success: false, error: 'Approved Storyboard could not be loaded.' }
  }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising director and cinematographer. Convert the approved storyboard into a production-ready shot design document. Use clear markdown. Start with a Shot Design Overview, camera strategy, lens approach, movement rules, aspect ratio and coverage summary. Then create a numbered shot list. For every shot include: Shot Number, Storyboard Frame Reference, Timecode or Duration, Shot Size, Camera Angle, Lens or Focal Length, Camera Position, Camera Movement, Composition and Blocking, Subject Action, Lighting Notes, Focus or Depth of Field, Frame Rate or Motion Treatment, Transition or Edit Intent, Production Requirements, Continuity Notes and AI Video Generation Prompt. Preserve the approved storyboard, timing, claims and creative direction. Do not introduce new scenes or product claims.',
      prompt: [
        'APPROVED STORYBOARD:',
        storyboardBody,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 7000,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'shot_design',
      target_artifact_type: 'shot_design',
      artifact_title: 'Shot Design',
      artifact_content: { body: output.text, type: 'shot_design' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Shot Design.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Shot Design generation failed.' }
  }
}

export async function decideShotDesign(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'shot_design',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Shot Design decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
