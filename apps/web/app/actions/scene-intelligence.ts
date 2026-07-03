'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getSceneIntelligenceVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'scene_intelligence')
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Scene Intelligence versions.')

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

export async function generateSceneIntelligence(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const [assetBody, shotBody, storyboardBody, scriptBody] = await Promise.all([
    loadLatestBody(input.productionId, 'asset_creation'),
    loadLatestBody(input.productionId, 'shot_design'),
    loadLatestBody(input.productionId, 'storyboard'),
    loadLatestBody(input.productionId, 'script'),
  ])

  if (!assetBody || !shotBody || !storyboardBody || !scriptBody) {
    return { success: false, error: 'Approved Script, Storyboard, Shot Design and Asset Creation could not be loaded.' }
  }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising director, continuity supervisor and AI video systems planner. Convert the approved script, storyboard, shot design and asset register into a production-ready Scene Intelligence document. Use clear markdown. Start with a Scene System Overview and Global Continuity Rules. Then create numbered scene records. For every scene include: Scene ID, Purpose, Time Range, Related Script Segment, Storyboard Frames, Shot Numbers, Required Assets, Environment State, Character State, Wardrobe and Prop State, Lighting State, Camera Logic, Action Beats, Dialogue or Voiceover, On-Screen Text, Transition In, Transition Out, Continuity Dependencies, Generation Risks, Failure Checks and Scene Acceptance Criteria. Finish with a cross-scene continuity matrix and unresolved risk list. Preserve all approved timing, claims and creative decisions. Do not invent new scenes or assets.',
      prompt: [
        'APPROVED SCRIPT:',
        scriptBody,
        'APPROVED STORYBOARD:',
        storyboardBody,
        'APPROVED SHOT DESIGN:',
        shotBody,
        'APPROVED ASSET CREATION:',
        assetBody,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 9000,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'scene_intelligence',
      target_artifact_type: 'scene_intelligence',
      artifact_title: 'Scene Intelligence',
      artifact_content: { body: output.text, type: 'scene_intelligence' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Scene Intelligence.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Scene Intelligence generation failed.' }
  }
}

export async function decideSceneIntelligence(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'scene_intelligence',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Scene Intelligence decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
