export type SectionType =
  | 'custom'
  | 'visual_language'
  | 'tone_atmosphere'
  | 'influences'
  | 'what_this_is_not'

export interface CompassSection {
  id: string
  project_id: string
  title: string
  content: string
  section_type: SectionType
  sort_order: number
  created_at: string
  updated_at: string
}

// Client-side aggregate — not a DB row type
export interface CreativeCompass {
  project_id: string
  sections: CompassSection[]
}
