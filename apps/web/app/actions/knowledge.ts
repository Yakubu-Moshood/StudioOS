'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { KnowledgeEntry, KnowledgeType } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const MAX_ENTRIES = 100

interface KnowledgeRow {
  id: string
  project_id: string
  user_id: string
  title: string
  content: string | null
  type: string
  source_url: string | null
  source_title: string | null
  created_at: string
  updated_at: string
}

function rowToEntry(row: KnowledgeRow): KnowledgeEntry {
  return {
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    title: row.title,
    content: row.content,
    type: row.type as KnowledgeType,
    source_url: row.source_url,
    source_title: row.source_title,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getKnowledgeEntries(projectId: string): Promise<KnowledgeEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return (data as KnowledgeRow[]).map(rowToEntry)
}

export async function addKnowledgeEntry(input: {
  projectId: string
  title: string
  content: string
  type: KnowledgeType
  sourceUrl: string
  sourceTitle: string
}): Promise<ActionResult<KnowledgeEntry>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { count } = await supabase
    .from('knowledge_entries')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', input.projectId)

  if ((count ?? 0) >= MAX_ENTRIES) {
    return { success: false, error: `Entry limit reached (${MAX_ENTRIES} maximum).` }
  }

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      project_id: input.projectId,
      user_id: user.id,
      title,
      content: input.content.trim() || null,
      type: input.type,
      source_url: input.sourceUrl.trim() || null,
      source_title: input.sourceTitle.trim() || null,
    })
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to add entry.' }

  revalidatePath(`/workspace/${input.projectId}/knowledge`)
  return { success: true, data: rowToEntry(data as KnowledgeRow) }
}

export async function updateKnowledgeEntry(input: {
  entryId: string
  projectId: string
  title: string
  content: string
  type: KnowledgeType
  sourceUrl: string
  sourceTitle: string
}): Promise<ActionResult<KnowledgeEntry>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('knowledge_entries')
    .update({
      title,
      content: input.content.trim() || null,
      type: input.type,
      source_url: input.sourceUrl.trim() || null,
      source_title: input.sourceTitle.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.entryId)
    .eq('project_id', input.projectId)
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to update entry.' }

  revalidatePath(`/workspace/${input.projectId}/knowledge`)
  return { success: true, data: rowToEntry(data as KnowledgeRow) }
}

export async function deleteKnowledgeEntry(input: {
  entryId: string
  projectId: string
}): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', input.entryId)
    .eq('project_id', input.projectId)

  if (error) return { success: false, error: 'Failed to delete entry.' }

  revalidatePath(`/workspace/${input.projectId}/knowledge`)
  return { success: true, data: undefined }
}
