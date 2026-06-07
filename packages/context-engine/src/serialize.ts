import type { AssembledPromptContext, ProjectContext, SerializeOptions } from './types'

const DEFAULT_TOKEN_BUDGET = 8000

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function buildCoreBlock(ctx: ProjectContext): string {
  const lines: string[] = [`# Project: ${ctx.projectTitle}`]

  if (ctx.projectFormat) {
    lines.push(`Format: ${ctx.projectFormat}`)
  }

  if (ctx.core) {
    if (ctx.core.synopsis) lines.push(`\nSynopsis: ${ctx.core.synopsis}`)
    if (ctx.core.genre) lines.push(`Genre: ${ctx.core.genre}`)
    if (ctx.core.tone) lines.push(`Tone: ${ctx.core.tone}`)
    if (ctx.core.themes.length > 0) lines.push(`Themes: ${ctx.core.themes.join(', ')}`)
  }

  return lines.join('\n')
}

function buildCompassBlock(entries: ProjectContext['compass']): string {
  if (entries.length === 0) return ''

  const lines: string[] = ['## Creative Compass']
  for (const entry of entries) {
    lines.push(`\n### ${entry.title} (${entry.sectionType})\n${entry.content}`)
  }
  return lines.join('\n')
}

function buildAssetsBlock(assets: ProjectContext['assets']): string {
  if (assets.length === 0) return ''

  const lines: string[] = ['## Assets']
  for (const asset of assets) {
    const desc = asset.description ? ` — ${asset.description}` : ''
    const url = asset.resolvedUrl ? ` [${asset.resolvedUrl}]` : ''
    const tags = asset.tags.length > 0 ? ` (tags: ${asset.tags.join(', ')})` : ''
    lines.push(`- ${asset.name} [${asset.type}]${desc}${url}${tags}`)
  }
  return lines.join('\n')
}

function buildBlocksBlock(blocks: ProjectContext['blocks']): string {
  if (blocks.length === 0) return ''

  const lines: string[] = ['## Production Map']
  for (const block of blocks) {
    const snippet = block.content ? ` — ${block.content.slice(0, 200)}` : ''
    lines.push(`- [${block.type.toUpperCase()}] ${block.title} (${block.status})${snippet}`)
  }
  return lines.join('\n')
}

export function serializeContext(
  ctx: ProjectContext,
  options?: SerializeOptions
): AssembledPromptContext {
  const budget = options?.tokenBudget ?? DEFAULT_TOKEN_BUDGET

  const coreBlock = buildCoreBlock(ctx)
  const coreTokens = estimateTokens(coreBlock)

  // Trim priority (lowest to highest): assets → blocks → compass; core never trimmed
  let compassEntries = [...ctx.compass]
  let blockEntries = [...ctx.blocks]
  let assetEntries = [...ctx.assets]

  let compassBlock = buildCompassBlock(compassEntries)
  let blocksBlock = buildBlocksBlock(blockEntries)
  let assetsBlock = buildAssetsBlock(assetEntries)

  const total = () =>
    coreTokens + estimateTokens(compassBlock) + estimateTokens(blocksBlock) + estimateTokens(assetsBlock)

  while (total() > budget && assetEntries.length > 0) {
    assetEntries = assetEntries.slice(0, -1)
    assetsBlock = buildAssetsBlock(assetEntries)
  }

  while (total() > budget && blockEntries.length > 0) {
    blockEntries = blockEntries.slice(0, -1)
    blocksBlock = buildBlocksBlock(blockEntries)
  }

  while (total() > budget && compassEntries.length > 0) {
    compassEntries = compassEntries.slice(0, -1)
    compassBlock = buildCompassBlock(compassEntries)
  }

  const parts: string[] = [coreBlock]
  if (compassBlock) parts.push(compassBlock)
  if (blocksBlock) parts.push(blocksBlock)
  if (assetsBlock) parts.push(assetsBlock)

  const text = parts.join('\n\n')
  return { text, estimatedTokens: estimateTokens(text) }
}
