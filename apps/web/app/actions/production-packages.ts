'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ProductionPackageVersionView extends ArtifactVersion {
  approval: Approval | null
}

export async function getProductionPackageVersions(
  productionId: string
): Promise<ProductionPackageVersionView[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: artifact, error: artifactError } = await supabase
    .from('artifacts')
    .select('id')
    .eq('production_id', productionId)
    .eq('artifact_type', 'production_package')
    .maybeSingle()

  if (artifactError) throw new Error('Failed to load Production Package artifact.')
  if (!artifact) return []

  const { data, error } = await supabase
    .from('artifact_versions')
    .select('*, approvals(*)')
    .eq('artifact_id', artifact.id)
    .order('version_number', { ascending: false })

  if (error) throw new Error('Failed to load Production Package versions.')

  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return {
      ...(version as ArtifactVersion),
      approval: (approval as Approval | null | undefined) ?? null,
    }
  })
}

export async function assembleProductionPackage(input: {
  projectId: string
  productionId: string
}): Promise<ActionResult<ArtifactVersion>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('assemble_production_package', {
    target_production_id: input.productionId,
  })

  if (error || !data) {
    return {
      success: false,
      error: 'Package assembly requires approved Brief, Research and Script versions.',
    }
  }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decideProductionPackageVersion(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<ActionResult<Approval>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('decide_production_package_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })

  if (error || !data) {
    return { success: false, error: 'Failed to record Production Package decision.' }
  }

  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
