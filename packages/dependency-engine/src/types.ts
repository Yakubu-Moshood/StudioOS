export type ArtifactType = 'compass_section' | 'asset' | 'project_core' | 'project'

export type DependencyType = 'references' | 'informed_by' | 'contrasts_with'

export interface ArtifactRef {
  id: string
  type: ArtifactType
}

export interface Dependency {
  id: string
  projectId: string
  source: ArtifactRef
  target: ArtifactRef
  dependencyType: DependencyType
  createdAt: string
}

// Option B adjacency map — every artifact that appears in any dependency edge is a key.
// Artifacts with no dependencies are absent from the map.
export type DependencyGraph = Record<
  string,
  { dependsOn: ArtifactRef[]; dependedOnBy: ArtifactRef[] }
>

// Internal DB row shape — not part of the public API.
// Exported for use within this package only; not re-exported from index.ts.
export interface DependencyRow {
  id: string
  project_id: string
  source_type: ArtifactType
  source_id: string
  target_type: ArtifactType
  target_id: string
  dependency_type: DependencyType
  created_at: string
}

export function rowToDependency(row: DependencyRow): Dependency {
  return {
    id: row.id,
    projectId: row.project_id,
    source: { id: row.source_id, type: row.source_type },
    target: { id: row.target_id, type: row.target_type },
    dependencyType: row.dependency_type,
    createdAt: row.created_at,
  }
}
