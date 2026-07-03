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

async function loadLatestArtifactBody(productionId: string, artifactType: string): Promise<string | null> {
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

async function saveCreativeStageVersion(input: {
  productionId: string
  stageKey: string
  artifactType: string
  title: string
  body: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_creative_stage_version', {
    target_production_id: input.productionId,
    target_stage_key: input.stageKey,
    target_artifact_type: input.artifactType,
    artifact_title: input.title,
    artifact_content: { body: input.body, type: input.artifactType },
  })

  if (error || !data) return { success: false, error: `Failed to save ${input.title}.` }
  return { success: true, data: data as ArtifactVersion }
}

async function decideCreativeStage(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  stageKey: string
  title: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_creative_stage_version', {
    target_artifact_version_id: input.artifactVersionId,
    target_stage_key: input.stageKey,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: `Failed to record ${input.title} decision.` }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}

export async function generateBigCreativeIdea(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const source = await loadLatestArtifactBody(input.productionId, 'research')
  if (!source) return { success: false, error: 'Approved Strategic Discovery could not be loaded.' }

  try {
    const output = await generate({
      systemPrompt: 'You are an award-winning advertising creative director. Based only on the approved Strategic Discovery, develop one powerful, ownable Big Creative Idea. Return clear markdown with exactly these headings: Core Human Truth, Big Creative Idea, Campaign Promise, Creative Territory, Why It Can Travel, Guardrails. Do not write scripts or executions yet.',
      prompt: [
        'APPROVED STRATEGIC DISCOVERY:',
        source,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 2500,
    })

    const result = await saveCreativeStageVersion({
      productionId: input.productionId,
      stageKey: 'big_creative_idea',
      artifactType: 'big_creative_idea',
      title: 'Big Creative Idea',
      body: output.text,
    })

    if (!result.success) return result
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return result
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
  return decideCreativeStage({ ...input, stageKey: 'big_creative_idea', title: 'Big Creative Idea' })
}

export async function generateConceptDevelopment(input: {
  projectId: string
  productionId: string
  instruction?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const source = await loadLatestArtifactBody(input.productionId, 'big_creative_idea')
  if (!source) return { success: false, error: 'Approved Big Creative Idea could not be loaded.' }

  try {
    const output = await generate({
      systemPrompt: 'You are a senior advertising creative director. Develop three distinct campaign concepts from the approved Big Creative Idea, then recommend one. Use clear markdown. For each concept include: Concept Name, Core Premise, Audience Experience, Hero Film Direction, Social Extensions, Visual Tone, Strengths, Risks. End with a Recommended Concept section explaining the choice. Do not write the final script yet.',
      prompt: [
        'APPROVED BIG CREATIVE IDEA:',
        source,
        input.instruction?.trim() ? `ADDITIONAL DIRECTION:\n${input.instruction.trim()}` : '',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 4000,
    })

    const result = await saveCreativeStageVersion({
      productionId: input.productionId,
      stageKey: 'concept_development',
      artifactType: 'concept_development',
      title: 'Concept Development',
      body: output.text,
    })

    if (!result.success) return result
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return result
  } catch {
    return { success: false, error: 'Concept Development generation failed.' }
  }
}

export async function decideConceptDevelopment(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  return decideCreativeStage({ ...input, stageKey: 'concept_development', title: 'Concept Development' })
}
