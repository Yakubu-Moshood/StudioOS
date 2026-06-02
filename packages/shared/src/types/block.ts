export type BlockType =
  | 'scene'
  | 'sequence'
  | 'act'
  | 'beat'
  | 'note'
  | 'other'

export type BlockStatus =
  | 'draft'
  | 'in_progress'
  | 'complete'
  | 'needs_revision'

export interface Block {
  id: string
  project_id: string
  type: BlockType
  title: string
  content: string | null
  status: BlockStatus
  order: number
  parent_id: string | null
  created_at: string
  updated_at: string
}
