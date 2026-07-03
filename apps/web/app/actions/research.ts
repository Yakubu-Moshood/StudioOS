'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion, Run } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ResearchVersionView extends ArtifactVersion {
  approval: Approval | null
}

export async function getResearchVersions(productionId: string): Promise<ResearchVersionView[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'research')
    .maybeSingle()

  if (artifactError) throw new Error('Failed to load Research artifact.')
  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Research versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return {
      ...(version as ArtifactVersion),
      approval: (approval as Approval | null | undefined) ?? null,
    }
  })
}

export async function generateResearch(input: {
  projectId: string
  productionId: string
  revisionInstruction?: string
}): Promise<ActionResult<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: runData, error: startError } = await supabase.rpc('start_research_run', {
    target_production_id: input.productionId,
  })

  if (startError || !runData) {
    return { success: false, error: 'Research cannot start. Confirm the Brief is approved.' }
  }

  const run = runData as Run

  try {
    const briefVersionId = String(run.input.brief_version_id ?? '')
    const { data: briefVersion, error: briefError } = await supabase
      .from('artifact_versions')
      .select('content')
      .eq('id', briefVersionId)
      .single()

    if (briefError || !briefVersion) throw new Error('Approved Brief could not be loaded.')

    const briefBody = String((briefVersion.content as Record<string, unknown>).body ?? '')
    const revisionInstruction = input.revisionInstruction?.trim()

    const output = await generate({
      systemPrompt:
        'You are the Research stage of a creative production workflow. Produce factual, structured research that directly supports the approved production brief. Clearly separate verified facts, useful context, open questions, risks, and suggested source directions. Do not write the script.',
      prompt: [
        'APPROVED PRODUCTION BRIEF:',
        briefBody,
        revisionInstruction ? `REVISION INSTRUCTION:\n${revisionInstruction}` : '',
        'Return a production-ready research document in clear markdown.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      maxTokens: 4000,
    })

    const { data: version, error: completeError } = await supabase.rpc('complete_research_run', {
      target_run_id: run.id,
      research_content: { body: output.text },
      provider_name: output.provider,
      model_name: output.model,
      token_metadata: {
        input_tokens: output.inputTokens ?? null,
        output_tokens: output.outputTokens ?? null,
      },
    })

    if (completeError || !version) throw new Error('Research output could not be stored.')

    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: version as ArtifactVersion }
  } catch (error) {
    await supabase.rpc('fail_research_run', {
      target_run_id: run.id,
      failure: {
        message: error instanceof Error ? error.message : 'Research generation failed.',
      },
    })

    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: false, error: 'Research generation failed. The run was recorded and can be retried.' }
  }
}

export async function decideResearchVersion(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<ActionResult<Approval>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('decide_research_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Research decision.' }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
