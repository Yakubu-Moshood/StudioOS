import type { SupabaseClient } from '@supabase/supabase-js'
import { assembleContext, serializeContext } from '@studioos/context-engine'
import type { ProjectContext } from '@studioos/context-engine'
import type { AssemblyMode, AssemblyOptions, AssemblyRequest, PromptSegment } from './types'

const USER_INSTRUCTION_MAX_CHARS = 2000

function filterContextByMode(ctx: ProjectContext, mode: AssemblyMode): ProjectContext {
  switch (mode) {
    case 'full_context':
      return ctx
    case 'compass_only':
      return { ...ctx, core: null, assets: [], blocks: [], knowledge: [] }
    case 'core_only':
      return { ...ctx, compass: [], assets: [], blocks: [], knowledge: [] }
    case 'bare':
      return { ...ctx, core: null, compass: [], assets: [], blocks: [], knowledge: [] }
  }
}

export async function buildRequest(
  client: SupabaseClient,
  projectId: string,
  mode: AssemblyMode,
  userInstruction: string,
  options?: AssemblyOptions
): Promise<AssemblyRequest> {
  const trimmedInstruction = userInstruction.slice(0, USER_INSTRUCTION_MAX_CHARS)

  const fullContext = await assembleContext(client, projectId)
  const filteredContext = filterContextByMode(fullContext, mode)
  const serializeOptions = options?.tokenBudget !== undefined ? { tokenBudget: options.tokenBudget } : undefined
  const serialized = serializeContext(filteredContext, serializeOptions)

  const coreCharCount = filteredContext.core
    ? [
        filteredContext.core.synopsis ?? '',
        filteredContext.core.genre ?? '',
        filteredContext.core.tone ?? '',
        ...filteredContext.core.themes,
      ].join(' ').length
    : 0

  const compassCharCount = filteredContext.compass
    .map((s) => s.title + ' ' + s.content)
    .join(' ').length

  const blocksCharCount = filteredContext.blocks
    .map((b) => b.title + (b.content ?? ''))
    .join(' ').length

  const assetsCharCount = filteredContext.assets
    .map((a) => a.name + (a.description ?? ''))
    .join(' ').length

  const knowledgeCharCount = filteredContext.knowledge
    .map((k) => k.title + (k.content ?? ''))
    .join(' ').length

  const segments: PromptSegment[] = [
    {
      segmentName: 'core',
      included: filteredContext.core !== null,
      characterCount: coreCharCount,
    },
    {
      segmentName: 'compass',
      included: filteredContext.compass.length > 0,
      characterCount: compassCharCount,
    },
    {
      segmentName: 'blocks',
      included: filteredContext.blocks.length > 0,
      characterCount: blocksCharCount,
    },
    {
      segmentName: 'knowledge',
      included: filteredContext.knowledge.length > 0,
      characterCount: knowledgeCharCount,
    },
    {
      segmentName: 'assets',
      included: filteredContext.assets.length > 0,
      characterCount: assetsCharCount,
    },
    {
      segmentName: 'user_instruction',
      included: trimmedInstruction.length > 0,
      characterCount: trimmedInstruction.length,
    },
  ]

  const instructionSuffix = trimmedInstruction
    ? `\n\n## User Instruction\n\n${trimmedInstruction}`
    : ''

  return {
    promptVersion: 1,
    projectId,
    mode,
    userInstruction: trimmedInstruction,
    segments,
    assembledPrompt: serialized.text + instructionSuffix,
  }
}
