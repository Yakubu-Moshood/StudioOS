'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getStoryboardVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'storyboard')
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Storyboard versions.')

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

export async function generateStoryboard(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const [scriptBody, visualBody] = await Promise.all([
    loadLatestBody(input.productionId, 'script'),
    loadLatestBody(input.productionId, 'visual_development'),
  ])

  if (!scriptBody || !visualBody) {
    return { success: false, error: 'Approved Script and Visual Development could not be loaded.' }
  }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising storyboard artist and director. Convert the approved script and visual development guide into a production-ready text storyboard. Use clear markdown. Start with Storyboard Overview and Timing Summary. Then create numbered frames. For every frame include: Timecode, Shot Purpose, Visual Description, Subject Action, Camera and Composition, Lighting and Colour, Dialogue or Voiceover, On-Screen Text, Transition, Continuity Notes, Image Generation Prompt. Keep total timing faithful to the approved script. Do not invent new product claims.',
      prompt: [
        'APPROVED ADVERTISING SCRIPT:',
        scriptBody,
        'APPROVED VISUAL DEVELOPMENT:',
        visualBody,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 7000,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'storyboard',
      target_artifact_type: 'storyboard',
      artifact_title: 'Storyboard',
      artifact_content: { body: output.text, type: 'storyboard' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Storyboard.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Storyboard generation failed.' }
  }
}

export async function decideStoryboard(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'storyboard',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Storyboard decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
