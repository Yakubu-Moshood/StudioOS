export type ProjectFormat =
  | 'Film'
  | 'Series'
  | 'Commercial'
  | 'Documentary'
  | 'YouTube'
  | 'Other'

export type ProjectStatus = 'active' | 'archived'

export interface Project {
  id: string
  owner_id: string
  organisation_id: string | null
  title: string
  format: ProjectFormat
  status: ProjectStatus
  archived_at: string | null
  created_at: string
  updated_at: string
}
