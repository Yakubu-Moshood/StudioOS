'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getAiGenerationPackageVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'ai_generation_package').maybeSingle()
  if (!artifact) return []
  const { data, error } = await supabase.from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id).order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load AI Generation Package versions.')
  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

async function loadLatestBody(productionId: string, artifactType: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', artifactType).maybeSingle()
  if (!artifact) return null
  const { data: version } = await supabase.from('artifact_versions').select('content').eq('artifact_id', artifact.id).order('version_number', { ascending: false }).limit(1).maybeSingle()
  const body = (version?.content as Record<string, unknown> | undefined)?.body
  return typeof body === 'string' ? body : null
}

export async function generateAiGenerationPackage(input: { projectId: string; productionId: string; instruction?: string }): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const [sceneBody, assetBody, shotBody, storyboardBody, scriptBody] = await Promise.all([
    loadLatestBody(input.productionId, 'scene_intelligence'),
    loadLatestBody(input.productionId, 'asset_creation'),
    loadLatestBody(input.productionId, 'shot_design'),
    loadLatestBody(input.productionId, 'storyboard'),
    loadLatestBody(input.productionId, 'script'),
  ])
  if (!sceneBody || !assetBody || !shotBody || !storyboardBody || !scriptBody) return { success: false, error: 'Approved generation inputs could not be loaded.' }

  try {
    const output = await generate({
      systemPrompt: 'Create a clear production package for generating the approved campaign video. Organise the work into numbered units with scene and shot references, required assets, visual instructions, motion instructions, consistency rules, output settings, retry guidance, quality checks, acceptance criteria, generation order, dependencies and handoff notes. Preserve all approved timing, claims and continuity.',
      prompt: ['SCRIPT:', scriptBody, 'STORYBOARD:', storyboardBody, 'SHOT DESIGN:', shotBody, 'ASSETS:', assetBody, 'SCENE INTELLIGENCE:', sceneBody, input.instruction?.trim() ? `DIRECTION:\n${input.instruction.trim()}` : ''].filter(Boolean).join('\n\n'),
      maxTokens: 10000,
    })
    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'ai_generation_package',
      target_artifact_type: 'ai_generation_package',
      artifact_title: 'AI Generation Package',
      artifact_content: { body: output.text, type: 'ai_generation_package' },
    })
    if (error || !data) return { success: false, error: 'Failed to save AI Generation Package.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'AI Generation Package generation failed.' }
  }
}

export async function decideAiGenerationPackage(input: { projectId: string; productionId: string; artifactVersionId: string; decision: 'approved' | 'revision_requested'; comment?: string }): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'ai_generation_package',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: 'Failed to record AI Generation Package decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
