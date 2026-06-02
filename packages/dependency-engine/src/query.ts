import type { SupabaseClient } from '@supabase/supabase-js'
import type { ArtifactRef, ArtifactType, Dependency, DependencyGraph, DependencyRow } from './types'
import { rowToDependency } from './types'

// Caps the adjacency list size per node, preventing runaway expansion
// on circular or highly-connected graphs.
const MAX_GRAPH_DEPTH = 10

export interface GetDependenciesInput {
  projectId: string
  artifactId: string
  artifactType: ArtifactType
  direction: 'outgoing' | 'incoming' | 'both'
}

export async function getDependencies(
  client: SupabaseClient,
  input: GetDependenciesInput
): Promise<Dependency[]> {
  const rows: DependencyRow[] = []

  if (input.direction === 'outgoing' || input.direction === 'both') {
    const { data } = await client
      .from('artifact_dependencies')
      .select('*')
      .eq('project_id', input.projectId)
      .eq('source_type', input.artifactType)
      .eq('source_id', input.artifactId)

    if (data) rows.push(...(data as DependencyRow[]))
  }

  if (input.direction === 'incoming' || input.direction === 'both') {
    const { data } = await client
      .from('artifact_dependencies')
      .select('*')
      .eq('project_id', input.projectId)
      .eq('target_type', input.artifactType)
      .eq('target_id', input.artifactId)

    if (data) rows.push(...(data as DependencyRow[]))
  }

  // Deduplicate by id (only possible when direction === 'both' and source === target,
  // which the schema does not prohibit)
  const seen = new Set<string>()
  return rows
    .filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    .map(rowToDependency)
}

export async function getDependencyGraph(
  client: SupabaseClient,
  projectId: string
): Promise<DependencyGraph> {
  const { data, error } = await client
    .from('artifact_dependencies')
    .select('*')
    .eq('project_id', projectId)

  if (error || !data) return {}

  const rows = data as DependencyRow[]
  const graph: DependencyGraph = {}

  function getOrCreate(id: string): { dependsOn: ArtifactRef[]; dependedOnBy: ArtifactRef[] } {
    if (!graph[id]) graph[id] = { dependsOn: [], dependedOnBy: [] }
    return graph[id]
  }

  for (const row of rows) {
    const sourceNode = getOrCreate(row.source_id)
    const targetNode = getOrCreate(row.target_id)

    // MAX_GRAPH_DEPTH caps the adjacency list per node, guarding against
    // runaway expansion on circular or degenerate dependency graphs.
    if (sourceNode.dependsOn.length < MAX_GRAPH_DEPTH) {
      sourceNode.dependsOn.push({ id: row.target_id, type: row.target_type })
    }

    if (targetNode.dependedOnBy.length < MAX_GRAPH_DEPTH) {
      targetNode.dependedOnBy.push({ id: row.source_id, type: row.source_type })
    }
  }

  return graph
}
