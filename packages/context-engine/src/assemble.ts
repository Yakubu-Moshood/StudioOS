import type { SupabaseClient } from '@supabase/supabase-js'
import type { Asset, CompassSection, ProjectCore } from '@studioos/shared'
import type { AssetContext, BlockContext, CompassEntryContext, CoreContext, KnowledgeContext, ProjectContext } from './types'

const INCLUDED_ASSET_TYPES = ['image', 'document']

export async function assembleContext(
  client: SupabaseClient,
  projectId: string
): Promise<ProjectContext> {
  const [projectResult, coreResult, compassResult, assetsResult, blocksResult, knowledgeResult] = await Promise.all([
    client
      .from('projects')
      .select('id, title, format, status')
      .eq('id', projectId)
      .single(),
    client
      .from('project_core')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle(),
    client
      .from('compass_sections')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    client
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .in('type', INCLUDED_ASSET_TYPES),
    client
      .from('blocks')
      .select('id, type, title, content, status, sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true }),
    client
      .from('knowledge_entries')
      .select('id, title, content, type, source_url, source_title')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
  ])

  // Graceful fallback — RLS returns null/empty rather than throwing on auth failure
  const projectData = projectResult.data as {
    id: string
    title: string
    format: string
    status: string
  } | null

  const coreData = coreResult.data as ProjectCore | null
  const sections = (compassResult.data ?? []) as CompassSection[]
  const rawAssets = (assetsResult.data ?? []) as Asset[]
  const rawBlocks = (blocksResult.data ?? []) as Array<{
    id: string; type: string; title: string; content: string | null
    status: string; sort_order: number
  }>
  const rawKnowledge = (knowledgeResult.data ?? []) as Array<{
    id: string; title: string; content: string | null
    type: string; source_url: string | null; source_title: string | null
  }>

  const coreContext: CoreContext | null = coreData
    ? {
        synopsis: coreData.synopsis,
        genre: coreData.genre,
        tone: coreData.tone,
        themes: coreData.themes,
      }
    : null

  const compassEntries: CompassEntryContext[] = sections
    .filter((s) => s.content.trim().length > 0)
    .map((s) => ({
      title: s.title,
      content: s.content,
      sectionType: s.section_type,
    }))

  const blockContexts: BlockContext[] = rawBlocks.map((b) => ({
    id: b.id,
    type: b.type,
    title: b.title,
    content: b.content,
    status: b.status,
    order: b.sort_order,
  }))

  const knowledgeContexts: KnowledgeContext[] = rawKnowledge.map((k) => ({
    id: k.id,
    title: k.title,
    content: k.content,
    type: k.type,
    source_url: k.source_url,
    source_title: k.source_title,
  }))

  const assetContexts: AssetContext[] = await Promise.all(
    rawAssets.map(async (asset): Promise<AssetContext> => {
      let resolvedUrl: string | null = null

      if (asset.source_type === 'uploaded' && asset.storage_path) {
        const { data: signedData } = await client.storage
          .from('assets')
          .createSignedUrl(asset.storage_path, 3600)
        resolvedUrl = signedData?.signedUrl ?? null
      } else if (asset.source_type === 'external') {
        resolvedUrl = asset.external_url
      }

      return {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        description: asset.description,
        tags: asset.tags,
        resolvedUrl,
      }
    })
  )

  return {
    projectId,
    projectTitle: projectData?.title ?? 'Untitled Project',
    projectFormat: projectData?.format ?? '',
    core: coreContext,
    compass: compassEntries,
    assets: assetContexts,
    blocks: blockContexts,
    knowledge: knowledgeContexts,
  }
}
