export type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'reference'
  | 'other'

export type AssetSource = 'upload' | 'external' | 'generated'

export type AssetSourceType = 'uploaded' | 'external'

export interface Asset {
  id: string
  project_id: string
  owner_id: string
  name: string
  type: AssetType
  source: AssetSource
  source_type: AssetSourceType
  storage_path: string | null
  external_url: string | null
  size: number | null
  mime_type: string | null
  description: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}
