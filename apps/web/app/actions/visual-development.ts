'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'
import type { CreativeStageVersion } from './creative-stages'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export async function getVisualDevelopmentVersions(productionId: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'visual_development')
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Visual Development versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function generateVisualDevelopment(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: scriptArtifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', input.productionId)
    .eq('artifact_type', 'script')
    .single()

  const { data: scriptVersion } = await supabase
    .from('artifact_versions')
    .select('content')
    .eq('artifact_id', scriptArtifact?.id ?? '')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const scriptBody = (scriptVersion?.content as Record<string, unknown> | undefined)?.body
  if (typeof scriptBody !== 'string') return { success: false, error: 'Approved Advertising Script could not be loaded.' }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising art director and cinematographer. Turn the approved advertising script into a coherent visual development guide. Use exactly these markdown headings: Visual North Star, Colour and Lighting, Production Design, Casting and Wardrobe, Camera Language, Composition and Movement, Typography and Graphics, Location Direction, Reference Image Briefs, Continuity Guardrails. Be specific enough for storyboard and image-generation teams, but do not create storyboard frames yet.',
      prompt: [
        'APPROVED ADVERTISING SCRIPT:',
        scriptBody,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 4000,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'visual_development',
      target_artifact_type: 'visual_development',
      artifact_title: 'Visual Development',
      artifact_content: { body: output.text, type: 'visual_development' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Visual Development.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Visual Development generation failed.' }
  }
}

export async function decideVisualDevelopment(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'visual_development',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Visual Development decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
