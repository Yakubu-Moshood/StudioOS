'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'

type Result<T> = { success: true; data: T } | { success: false; error: string }

export interface CreativeStageVersion extends ArtifactVersion {
  approval: Approval | null
}

export async function getCreativeStageVersions(productionId: string, artifactType: string): Promise<CreativeStageVersion[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', artifactType)
    .maybeSingle()

  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load creative stage versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function generateBigCreativeIdea(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: researchArtifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', input.productionId)
    .eq('artifact_type', 'research')
    .single()

  const { data: researchVersion } = await supabase
    .from('artifact_versions')
    .select('content')
    .eq('artifact_id', researchArtifact?.id ?? '')
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (!researchVersion) return { success: false, error: 'Approved Strategic Discovery could not be loaded.' }

  try {
    const output = await generate({
      systemPrompt: 'You are an award-winning advertising creative director. Based only on the approved Strategic Discovery, develop one powerful, ownable Big Creative Idea. Return clear markdown with exactly these headings: Core Human Truth, Big Creative Idea, Campaign Promise, Creative Territory, Why It Can Travel, Guardrails. Do not write scripts or executions yet.',
      prompt: [
        'APPROVED STRATEGIC DISCOVERY:',
        String((researchVersion.content as Record<string, unknown>).body ?? ''),
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 2500,
    })

    const { data, error } = await supabase.rpc('create_creative_stage_version', {
      target_production_id: input.productionId,
      target_stage_key: 'big_creative_idea',
      target_artifact_type: 'big_creative_idea',
      artifact_title: 'Big Creative Idea',
      artifact_content: { body: output.text, type: 'big_creative_idea' },
    })

    if (error || !data) return { success: false, error: 'Failed to save Big Creative Idea.' }
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: data as ArtifactVersion }
  } catch {
    return { success: false, error: 'Big Creative Idea generation failed.' }
  }
}

export async function decideBigCreativeIdea(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: 'big_creative_idea',
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Big Creative Idea decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
