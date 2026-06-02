import type { SupabaseClient } from '@supabase/supabase-js'
import { generate } from '@studioos/ai-service'
import type { AssemblyMode, AssemblyOptions, AssemblyResult, TokenUsage } from './types'
import { buildRequest } from './build'

export async function executeAssembly(
  client: SupabaseClient,
  projectId: string,
  mode: AssemblyMode,
  userInstruction: string,
  options?: AssemblyOptions
): Promise<AssemblyResult> {
  const request = await buildRequest(client, projectId, mode, userInstruction, options)
  const output = await generate({ prompt: request.assembledPrompt })

  const estimatedPromptTokens = Math.ceil(request.assembledPrompt.length / 4)
  const estimatedCompletionTokens = Math.ceil(output.text.length / 4)

  const tokenUsage: TokenUsage = {
    estimatedPromptTokens,
    estimatedCompletionTokens,
    estimatedTotalTokens: estimatedPromptTokens + estimatedCompletionTokens,
  }

  return {
    request,
    response: output.text,
    tokenUsage,
  }
}
