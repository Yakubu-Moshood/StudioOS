export type AssemblyMode = 'full_context' | 'compass_only' | 'core_only' | 'bare'

export interface PromptSegment {
  segmentName: string
  included: boolean
  characterCount: number
}

export interface TokenUsage {
  estimatedPromptTokens: number
  estimatedCompletionTokens: number
  estimatedTotalTokens: number
}

export interface AssemblyRequest {
  promptVersion: 1
  projectId: string
  mode: AssemblyMode
  userInstruction: string
  segments: PromptSegment[]
  assembledPrompt: string
}

export interface AssemblyOptions {
  tokenBudget?: number
}

export interface AssemblyResult {
  request: AssemblyRequest
  response: string
  tokenUsage: TokenUsage
}
