'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getAssetCreationVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'asset_creation')
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Asset Creation versions.')

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

export async function generateAssetCreation(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const [shotDesignBody, storyboardBody, visualBody] = await Promise.all([
    loadLatestBody(input.productionId, 'shot_design'),
    loadLatestBody(input.productionId, 'storyboard'),
    loadLatestBody(input.productionId, 'visual_development'),
  ])

  if (!shotDesignBody || !storyboardBody || !visualBody) {
    return { success: false, error: 'Approved Shot Design, Storyboard and Visual Development could not be loaded.' }
  }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising production designer and AI asset supervisor. Convert the approved visual development, storyboard and shot design into a production-ready asset creation plan. Use clear markdown. Start with an Asset Strategy and Asset Summary. Then create a numbered asset register. For every asset include: Asset ID, Asset Name, Asset Type, Purpose, Related Shot Numbers, Description, Required Variations, Dimensions or Aspect Ratio, Visual Style, Wardrobe or Prop Details, Environment Details, Brand Requirements, Source Method, Creation Prompt, Negative Prompt, Continuity Rules, File Naming Convention, Delivery Format and Approval Criteria. Group assets into characters or talent, locations and environments, props and products, wardrobe and styling, graphics and text, audio references and reusable technical elements. Do not claim that assets have already been rendered or produced. Preserve all approved creative and brand decisions.',
      prompt: [
        'APPROVED VISUAL DEVELOPMENT:',
        visualBody,
        'APPROVED STORYBOARD:',
        storyboardBody,
        'APPROVED SHOT DESIGN:',
        shotDesignBody,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 8000,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'asset_creation',
      target_artifact_type: 'asset_creation',
      artifact_title: 'Asset Creation',
      artifact_content: { body: output.text, type: 'asset_creation' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Asset Creation.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Asset Creation generation failed.' }
  }
}

export async function decideAssetCreation(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'asset_creation',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Asset Creation decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
