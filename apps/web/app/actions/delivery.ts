'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion, Run } from '@studioos/shared'

type Result<T> = { success: true; data: T } | { success: false; error: string }
export type DeliveryVersion = ArtifactVersion & { approval: Approval | null }

export async function getDeliveryVersions(productionId: string): Promise<DeliveryVersion[]> {
  const supabase = await createClient()
  const { data: artifact } = await supabase.from('artifacts').select('id').eq('production_id', productionId).eq('artifact_type', 'delivery_package').maybeSingle()
  if (!artifact) return []
  const { data, error } = await supabase.from('artifact_versions').select('*, approvals(*)').eq('artifact_id', artifact.id).order('version_number', { ascending: false })
  if (error) throw new Error('Failed to load Delivery versions.')
  return (data ?? []).map((row) => {
    const { approvals, ...version } = row
    const approval = Array.isArray(approvals) ? approvals[0] : approvals
    return { ...(version as ArtifactVersion), approval: (approval as Approval | null | undefined) ?? null }
  })
}

export async function startDelivery(input: { projectId: string; productionId: string }): Promise<Result<Run>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('start_delivery_run', { target_production_id: input.productionId })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to start Delivery.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Run }
}

export async function registerDeliveryPackage(input: {
  projectId: string
  productionId: string
  runId: string
  deliveryUrl: string
  deliveryMethod: string
  recipientName?: string
  notes?: string
  masterIncluded: boolean
  captionsIncluded: boolean
  thumbnailIncluded: boolean
  usageNotesIncluded: boolean
}): Promise<Result<ArtifactVersion>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('complete_delivery_run', {
    target_run_id: input.runId,
    delivery_url: input.deliveryUrl.trim(),
    delivery_method: input.deliveryMethod.trim(),
    recipient_name: input.recipientName?.trim() || null,
    delivery_metadata: {
      notes: input.notes?.trim() || null,
      checklist: {
        master: input.masterIncluded,
        captions: input.captionsIncluded,
        thumbnail: input.thumbnailIncluded,
        usage_notes: input.usageNotesIncluded,
      },
    },
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to register Delivery Package.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as ArtifactVersion }
}

export async function decideDeliveryPackage(input: {
  projectId: string
  productionId: string
  artifactVersionId: string
  decision: 'approved' | 'revision_requested'
  comment?: string
}): Promise<Result<Approval>> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('decide_delivery_package_version', {
    target_artifact_version_id: input.artifactVersionId,
    approval_decision: input.decision,
    decision_comment: input.comment?.trim() || null,
  })
  if (error || !data) return { success: false, error: error?.message ?? 'Failed to record Delivery decision.' }
  revalidatePath(`/workspace/${input.projectId}/productions/${input.productionId}`)
  return { success: true, data: data as Approval }
}
