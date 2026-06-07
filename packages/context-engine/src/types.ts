export interface CoreContext {
  synopsis: string | null
  genre: string | null
  tone: string | null
  themes: string[]
}

export interface CompassEntryContext {
  title: string
  content: string
  sectionType: string
}

export interface AssetContext {
  id: string
  name: string
  type: string
  description: string | null
  tags: string[]
  resolvedUrl: string | null
}

export interface BlockContext {
  id: string
  type: string
  title: string
  content: string | null
  status: string
  order: number
}

export interface KnowledgeContext {
  id: string
  title: string
  content: string | null
  type: string
  source_url: string | null
  source_title: string | null
}

export interface ProjectContext {
  projectId: string
  projectTitle: string
  projectFormat: string
  core: CoreContext | null
  compass: CompassEntryContext[]
  assets: AssetContext[]
  blocks: BlockContext[]
  knowledge: KnowledgeContext[]
}

export interface SerializeOptions {
  tokenBudget?: number
}

export interface AssembledPromptContext {
  text: string
  estimatedTokens: number
}

export interface ContextSummary {
  projectId: string
  contextWordCount: number
  compassSectionCount: number
  assetCount: number
  estimatedTokens: number
}
