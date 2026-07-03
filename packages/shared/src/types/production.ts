export type OrganisationRole = 'owner' | 'member'

export interface Organisation {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrganisationMember {
  organisation_id: string
  user_id: string
  role: OrganisationRole
  created_at: string
}

export type ProductionState =
  | 'draft'
  | 'ready'
  | 'active'
  | 'awaiting_approval'
  | 'paused'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type WorkflowKey = 'mvp_v1'
export type StageKey = 'brief' | 'research' | 'script' | 'production_package'
export type StageStatus =
  | 'pending'
  | 'ready'
  | 'active'
  | 'awaiting_approval'
  | 'completed'
  | 'blocked'

export type TaskStatus =
  | 'pending'
  | 'ready'
  | 'active'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled'

export interface Production {
  id: string
  project_id: string
  title: string
  state: ProductionState
  workflow_key: WorkflowKey
  created_by: string
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductionStage {
  id: string
  production_id: string
  stage_key: StageKey
  position: number
  status: StageStatus
  created_at: string
  updated_at: string
}

export interface ProductionTask {
  id: string
  stage_id: string
  task_key: string
  title: string
  position: number
  status: TaskStatus
  created_at: string
  updated_at: string
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface Job {
  id: string
  task_id: string
  job_type: string
  status: JobStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface Run {
  id: string
  job_id: string
  attempt: number
  status: RunStatus
  provider: string | null
  model: string | null
  provider_request_id: string | null
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: Record<string, unknown> | null
  started_at: string
  finished_at: string | null
}

export type ArtifactType = 'brief' | 'research' | 'script' | 'production_package'
export type ApprovalDecision = 'approved' | 'revision_requested'

export interface Artifact {
  id: string
  production_id: string
  artifact_type: ArtifactType
  title: string
  created_at: string
  updated_at: string
}

export interface ArtifactVersion {
  id: string
  artifact_id: string
  version_number: number
  content: Record<string, unknown>
  created_by: string
  source_run_id: string | null
  created_at: string
}

export interface Approval {
  id: string
  artifact_version_id: string
  decision: ApprovalDecision
  comment: string | null
  decided_by: string
  decided_at: string
}

export interface ProductionEvent {
  id: string
  production_id: string
  event_type: string
  actor_id: string | null
  entity_type: string | null
  entity_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

export interface ProductionPackageManifest {
  brief_version_id: string
  research_version_id: string
  script_version_id: string
}
