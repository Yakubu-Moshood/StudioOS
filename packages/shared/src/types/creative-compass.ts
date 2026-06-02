export interface CompassSection {
  id: string
  title: string
  content: string
  order: number
}

export interface CreativeCompass {
  id: string
  project_id: string
  sections: CompassSection[]
  created_at: string
  updated_at: string
}
