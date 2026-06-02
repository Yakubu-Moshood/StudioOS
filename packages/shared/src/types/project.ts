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
  title: string
  format: ProjectFormat
  status: ProjectStatus
  created_at: string
  updated_at: string
}
