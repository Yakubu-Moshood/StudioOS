export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'reference'
  | 'other'

export type AssetSource = 'upload' | 'external' | 'generated'

export interface Asset {
  id: string
  project_id: string
  user_id: string
  name: string
  type: AssetType
  source: AssetSource
  url: string
  size: number | null
  mime_type: string | null
  description: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}
