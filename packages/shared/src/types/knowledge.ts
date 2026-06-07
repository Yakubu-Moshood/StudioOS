export type KnowledgeType = 'text' | 'document' | 'url' | 'other'

export interface KnowledgeEntry {
  id: string
  project_id: string
  user_id: string
  title: string
  content: string | null
  type: KnowledgeType
  source_url: string | null
  source_title: string | null
  created_at: string
  updated_at: string
}
