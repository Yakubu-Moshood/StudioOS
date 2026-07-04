'use server'

import { createClient } from '@/lib/supabase/server'
import type { Approval, ArtifactVersion } from '@studioos/shared'

export interface ArtifactLibraryItem {
  artifactId: string
  artifactType: string
  latestVersion: ArtifactVersion | null
  approval: Approval | null
  outputUrl: string | null
  createdAt: string | null
}

interface ArtifactRow {
  id: string
  artifact_type: string
  created_at: string | null
  artifact_versions?: Array<ArtifactVersion & { approvals?: Approval[] | Approval | null }>
}

const URL_KEYS = ['video_url', 'master_url', 'delivery_url', 'package_url', 'campaign_url', 'url']

function findOutputUrl(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null
  const record = content as Record<string, unknown>

  for (const key of URL_KEYS) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return null
}

export async function getArtifactLibraryItems(productionId: string): Promise<ArtifactLibraryItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artifacts')
    .select('id, artifact_type, created_at, artifact_versions(*, approvals(*))')
    .eq('production_id', productionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Failed to load artifact library.')

  return ((data ?? []) as ArtifactRow[]).map((artifact) => {
    const versions = [...(artifact.artifact_versions ?? [])].sort((a, b) => b.version_number - a.version_number)
    const latestVersion = versions[0] ?? null
    const approvals = latestVersion?.approvals
    const approval = Array.isArray(approvals) ? approvals[0] ?? null : approvals ?? null

    return {
      artifactId: artifact.id,
      artifactType: artifact.artifact_type,
      latestVersion,
      approval,
      outputUrl: latestVersion ? findOutputUrl(latestVersion.content) : null,
      createdAt: artifact.created_at,
    }
  })
}
