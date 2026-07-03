'use server'

import { revalidatePath } from 'next/cache'
import { generate } from '@studioos/ai-service'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion, Run } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ScriptVersionView extends ArtifactVersion {
  approval: Approval | null
}

export async function getScriptVersions(productionId: string): Promise<ScriptVersionView[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'script')
    .maybeSingle()

  if (artifactError) throw new Error('Failed to load Script artifact.')
  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Script versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function generateScript(input: {
  projectId: string
  productionId: string
  revisionInstruction?: string
}): Promise<ActionResult<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: production } = await supabase
    .from('productions')
    .select('production_type')
    .eq('id', input.productionId)
    .single()

  const isAdvertising = production?.production_type === 'advertising_campaign'

  const { data: runData, error: startError } = await supabase.rpc('start_script_run', {
    target_production_id: input.productionId,
  })

  if (startError || !runData) {
    return { success: false, error: isAdvertising
      ? 'Script Development cannot start. Confirm Concept Development is approved.'
      : 'Script cannot start. Confirm Brief and Research are approved.' }
  }

  const run = runData as Run

  try {
    const briefVersionId = String(run.input.brief_version_id ?? '')
    const researchVersionId = String(run.input.research_version_id ?? '')

    const [{ data: briefVersion }, { data: researchVersion }] = await Promise.all([
      supabase.from('artifact_versions').select('content').eq('id', briefVersionId).single(),
      supabase.from('artifact_versions').select('content').eq('id', researchVersionId).single(),
    ])

    if (!briefVersion || !researchVersion) throw new Error('Approved inputs could not be loaded.')

    let sourceLabel = 'APPROVED PRODUCTION BRIEF AND RESEARCH'
    let sourceBody = [
      JSON.stringify(briefVersion.content, null, 2),
      String((researchVersion.content as Record<string, unknown>).body ?? ''),
    ].join('\n\n')

    if (isAdvertising) {
      const { data: conceptArtifact } = await supabase
        .from('artifacts')
        .select('id')
        .eq('production_id', input.productionId)
        .eq('artifact_type', 'concept_development')
        .single()

      const { data: conceptVersion } = await supabase
        .from('artifact_versions')
        .select('content')
        .eq('artifact_id', conceptArtifact?.id ?? '')
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (!conceptVersion) throw new Error('Approved Concept Development could not be loaded.')
      sourceLabel = 'APPROVED CAMPAIGN CONCEPT'
      sourceBody = String((conceptVersion.content as Record<string, unknown>).body ?? '')
    }

    const revisionInstruction = input.revisionInstruction?.trim()
    const output = await generate({
      systemPrompt: isAdvertising
        ? 'You are a senior advertising copywriter and film scriptwriter. Turn the approved campaign concept into a production-ready 30-second hero film script. Use exactly these markdown sections: Script Title, Duration, Format, Scene-by-Scene Script, Voiceover and Dialogue, On-Screen Text, End Frame and Call to Action, 15-Second Cutdown Notes. Make timings plausible and preserve all mandatory messaging. Do not add unsupported product claims.'
        : 'You are the Script stage of a creative production workflow. Write a production-ready script that follows the approved brief and uses only the approved research as factual grounding. Preserve clarity, structure, tone, pacing, and audience fit. Do not invent unsupported facts.',
      prompt: [
        `${sourceLabel}:`,
        sourceBody,
        revisionInstruction ? `REVISION INSTRUCTION:\n${revisionInstruction}` : '',
        isAdvertising
          ? 'Return the complete advertising script in clear markdown.'
          : 'Return the complete script in clear markdown.',
      ].filter(Boolean).join('\n\n'),
      maxTokens: 7000,
    })

    const { data: version, error: completeError } = await supabase.rpc('complete_script_run', {
      target_run_id: run.id,
      script_content: { body: output.text, type: isAdvertising ? 'advertising_script' : 'script' },
      provider_name: output.provider,
      model_name: output.model,
      token_metadata: {
        input_tokens: output.inputTokens ?? null,
        output_tokens: output.outputTokens ?? null,
      },
    })

    if (completeError || !version) throw new Error('Script output could not be stored.')

    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: true, data: version as ArtifactVersion }
  } catch (error) {
    await supabase.rpc('fail_script_run', {
      target_run_id: run.id,
      failure: { message: error instanceof Error ? error.message : 'Script generation failed.' },
    })
    revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
    return { success: false, error: 'Script generation failed. The run was recorded and can be retried.' }
  }
}

export async function decideScriptVersion(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<ActionResult<Approval>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('decide_script_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) return { success: false, error: 'Failed to record Script decision.' }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
