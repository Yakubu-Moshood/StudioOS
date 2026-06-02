import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContextSummary } from './types'
import { assembleContext } from './assemble'
import { serializeContext } from './serialize'

function countWords(text: string): number {
  if (!text.trim()) return 0
  return text.trim().split(/\s+/).length
}

export async function getContextSummary(
  client: SupabaseClient,
  projectId: string
): Promise<ContextSummary> {
  const ctx = await assembleContext(client, projectId)
  const assembled = serializeContext(ctx)

  return {
    projectId,
    contextWordCount: countWords(assembled.text),
    compassSectionCount: ctx.compass.length,
    assetCount: ctx.assets.length,
    estimatedTokens: assembled.estimatedTokens,
  }
}
