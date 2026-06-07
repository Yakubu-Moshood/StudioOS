'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Block, BlockType, BlockStatus } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const MAX_BLOCKS = 200

interface BlockRow {
  id: string
  project_id: string
  type: string
  title: string
  content: string | null
  status: string
  sort_order: number
  parent_id: string | null
  created_at: string
  updated_at: string
}

function rowToBlock(row: BlockRow): Block {
  return {
    id:         row.id,
    project_id: row.project_id,
    type:       row.type as BlockType,
    title:      row.title,
    content:    row.content,
    status:     row.status as BlockStatus,
    order:      row.sort_order,
    parent_id:  row.parent_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getBlocks(projectId: string): Promise<Block[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as BlockRow[]).map(rowToBlock)
}

export async function addBlock(input: {
  projectId: string
  type: BlockType
  title: string
  content: string
  status: BlockStatus
}): Promise<ActionResult<Block>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { count } = await supabase
    .from('blocks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', input.projectId)

  if ((count ?? 0) >= MAX_BLOCKS) {
    return { success: false, error: `Block limit reached (${MAX_BLOCKS} maximum).` }
  }

  const { data: maxRows } = await supabase
    .from('blocks')
    .select('sort_order')
    .eq('project_id', input.projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder =
    maxRows && maxRows.length > 0 ? (maxRows[0].sort_order as number) + 1 : 0

  const { data, error } = await supabase
    .from('blocks')
    .insert({
      project_id: input.projectId,
      type:       input.type,
      title,
      content:    input.content.trim(),
      status:     input.status,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to add block.' }

  revalidatePath(`/workspace/${input.projectId}/map`)
  return { success: true, data: rowToBlock(data as BlockRow) }
}

export async function updateBlock(input: {
  blockId:   string
  projectId: string
  type:      BlockType
  title:     string
  content:   string
  status:    BlockStatus
}): Promise<ActionResult<Block>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('blocks')
    .update({
      type:       input.type,
      title,
      content:    input.content.trim(),
      status:     input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.blockId)
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to update block.' }

  revalidatePath(`/workspace/${input.projectId}/map`)
  return { success: true, data: rowToBlock(data as BlockRow) }
}

export async function deleteBlock(input: {
  blockId:   string
  projectId: string
}): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', input.blockId)

  if (error) return { success: false, error: 'Failed to delete block.' }

  revalidatePath(`/workspace/${input.projectId}/map`)
  return { success: true, data: undefined }
}

export async function reorderBlock(input: {
  blockId:   string
  projectId: string
  direction: 'up' | 'down'
}): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('blocks')
    .select('id, sort_order')
    .eq('project_id', input.projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return { success: false, error: 'Failed to load blocks.' }

  const blocks = data as { id: string; sort_order: number }[]
  const index = blocks.findIndex((b) => b.id === input.blockId)

  if (index === -1) return { success: false, error: 'Block not found.' }

  const neighbourIndex = input.direction === 'up' ? index - 1 : index + 1

  if (neighbourIndex < 0 || neighbourIndex >= blocks.length) {
    return { success: true, data: undefined }
  }

  const target    = blocks[index]
  const neighbour = blocks[neighbourIndex]

  const { error: e1 } = await supabase
    .from('blocks')
    .update({ sort_order: neighbour.sort_order })
    .eq('id', target.id)

  if (e1) return { success: false, error: 'Failed to reorder block.' }

  const { error: e2 } = await supabase
    .from('blocks')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbour.id)

  if (e2) return { success: false, error: 'Failed to reorder block.' }

  revalidatePath(`/workspace/${input.projectId}/map`)
  return { success: true, data: undefined }
}
