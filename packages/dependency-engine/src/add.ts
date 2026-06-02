import type { SupabaseClient } from '@supabase/supabase-js'
import type { ArtifactType, Dependency, DependencyRow, DependencyType } from './types'
import { rowToDependency } from './types'

export interface AddDependencyInput {
  projectId: string
  source: { id: string; type: ArtifactType }
  target: { id: string; type: ArtifactType }
  dependencyType: DependencyType
}

// Maps ArtifactType to its DB table name for existence validation.
const ARTIFACT_TABLE: Record<ArtifactType, string> = {
  compass_section: 'compass_sections',
  asset: 'assets',
  project_core: 'project_core',
  project: 'projects',
}

async function artifactExists(
  client: SupabaseClient,
  type: ArtifactType,
  id: string,
  projectId: string
): Promise<boolean> {
  if (type === 'project') {
    // projects has no project_id column — it is the project
    const { data } = await client
      .from('projects')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    return data !== null
  }

  const { data } = await client
    .from(ARTIFACT_TABLE[type])
    .select('id')
    .eq('id', id)
    .eq('project_id', projectId)
    .maybeSingle()
  return data !== null
}

export async function addDependency(
  client: SupabaseClient,
  input: AddDependencyInput
): Promise<{ success: true; data: Dependency } | { success: false; error: string }> {
  const [sourceExists, targetExists] = await Promise.all([
    artifactExists(client, input.source.type, input.source.id, input.projectId),
    artifactExists(client, input.target.type, input.target.id, input.projectId),
  ])

  if (!sourceExists) return { success: false, error: 'Source artifact not found.' }
  if (!targetExists) return { success: false, error: 'Target artifact not found.' }

  const { data: inserted, error: insertError } = await client
    .from('artifact_dependencies')
    .insert({
      project_id: input.projectId,
      source_type: input.source.type,
      source_id: input.source.id,
      target_type: input.target.type,
      target_id: input.target.id,
      dependency_type: input.dependencyType,
    })
    .select()
    .single()

  if (!insertError && inserted) {
    return { success: true, data: rowToDependency(inserted as DependencyRow) }
  }

  // Unique constraint violation — fetch the existing record and return it
  if (insertError?.code === '23505') {
    const { data: existing } = await client
      .from('artifact_dependencies')
      .select('*')
      .eq('project_id', input.projectId)
      .eq('source_type', input.source.type)
      .eq('source_id', input.source.id)
      .eq('target_type', input.target.type)
      .eq('target_id', input.target.id)
      .eq('dependency_type', input.dependencyType)
      .single()

    if (existing) {
      return { success: true, data: rowToDependency(existing as DependencyRow) }
    }
  }

  return { success: false, error: 'Failed to add dependency.' }
}
