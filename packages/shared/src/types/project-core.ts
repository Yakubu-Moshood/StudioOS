export type Genre =
  | 'drama'
  | 'comedy'
  | 'thriller'
  | 'horror'
  | 'action'
  | 'romance'
  | 'documentary'
  | 'other'

export type Tone =
  | 'dark'
  | 'light'
  | 'satirical'
  | 'dramatic'
  | 'comedic'
  | 'neutral'
  | 'other'

export interface ProjectCore {
  id: string
  project_id: string
  synopsis: string | null
  genre: Genre | null
  tone: Tone | null
  themes: string[]
  created_at: string
  updated_at: string
}
