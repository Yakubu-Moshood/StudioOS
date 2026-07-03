'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'

type Result<T> = { success: true; data: T } | { success: false; error: string }
export type CampaignPackageVersion = ArtifactVersion & { approval: Approval | null }

export async function getCampaignPackageVersions(productionId: string): Promise<CampaignPackageVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'production_package').maybeSingle()
  if (!artifact) return []
  const { data, error } = await supabase.from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id).order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load Campaign Production Package versions.')
  return (data ?? []).filter((row) => (row.content as Record<string, unknown>)?.package_type === 'campaign_deployment').map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function assembleCampaignProductionPackage(input: {
  projectId: string
  productionId: string
  deploymentChannels: string
  campaignUrl?: string
  deploymentNotes?: string
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('assemble_campaign_production_package', {
    target_production_id: input.productionId,
    deployment_channels: input.deploymentChannels.trim(),
    campaign_url: input.campaignUrl?.trim() || null,
    deployment_notes: input.deploymentNotes?.trim() || null,
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to assemble Campaign Production Package.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decideCampaignProductionPackage(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_campaign_production_package_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to record Campaign Production Package decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
