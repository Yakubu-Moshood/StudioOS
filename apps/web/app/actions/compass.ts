'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CompassSection, SectionType } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

const MAX_SECTIONS = 50

export async function getSections(projectId: string): Promise<CompassSection[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compass_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data as CompassSection[]
}

export async function addSection(input: {
  projectId: string
  title: string
  content: string
  sectionType: SectionType
}): Promise<ActionResult<CompassSection>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { count } = await supabase
    .from('compass_sections')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', input.projectId)

  if ((count ?? 0) >= MAX_SECTIONS) {
    return { success: false, error: 'Section limit reached (50 maximum).' }
  }

  const { data: maxRows } = await supabase
    .from('compass_sections')
    .select('sort_order')
    .eq('project_id', input.projectId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = maxRows && maxRows.length > 0 ? maxRows[0].sort_order + 1 : 0

  const { data, error } = await supabase
    .from('compass_sections')
    .insert({
      project_id: input.projectId,
      title,
      content: input.content.trim(),
      section_type: input.sectionType,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to add section.' }

  revalidatePath(`/workspace/${input.projectId}/compass`)
  return { success: true, data: data as CompassSection }
}

export async function updateSection(input: {
  sectionId: string
  projectId: string
  title: string
  content: string
  sectionType: SectionType
}): Promise<ActionResult<CompassSection>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compass_sections')
    .update({
      title,
      content: input.content.trim(),
      section_type: input.sectionType,
    })
    .eq('id', input.sectionId)
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to update section.' }

  revalidatePath(`/workspace/${input.projectId}/compass`)
  return { success: true, data: data as CompassSection }
}

export async function deleteSection(input: {
  sectionId: string
  projectId: string
}): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('compass_sections')
    .delete()
    .eq('id', input.sectionId)

  if (error) return { success: false, error: 'Failed to delete section.' }

  revalidatePath(`/workspace/${input.projectId}/compass`)
  return { success: true, data: undefined }
}

export async function reorderSection(input: {
  sectionId: string
  projectId: string
  direction: 'up' | 'down'
}): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('compass_sections')
    .select('id, sort_order')
    .eq('project_id', input.projectId)
    .order('sort_order', { ascending: true })

  if (error || !data) return { success: false, error: 'Failed to load sections.' }

  const sections = data as { id: string; sort_order: number }[]
  const index = sections.findIndex((s) => s.id === input.sectionId)

  if (index === -1) return { success: false, error: 'Section not found.' }

  const neighbourIndex = input.direction === 'up' ? index - 1 : index + 1

  if (neighbourIndex < 0 || neighbourIndex >= sections.length) {
    return { success: true, data: undefined }
  }

  const target = sections[index]
  const neighbour = sections[neighbourIndex]

  // Three-step swap required by UNIQUE(project_id, sort_order).
  // Step 1 uses a guaranteed-negative temp value to vacate target's slot
  // without conflicting with any existing sort_order (all valid values >= 0).
  const tempOrder = -(target.sort_order + 1)

  const { error: e1 } = await supabase
    .from('compass_sections')
    .update({ sort_order: tempOrder })
    .eq('id', target.id)

  if (e1) return { success: false, error: 'Failed to reorder section.' }

  const { error: e2 } = await supabase
    .from('compass_sections')
    .update({ sort_order: target.sort_order })
    .eq('id', neighbour.id)

  if (e2) return { success: false, error: 'Failed to reorder section.' }

  const { error: e3 } = await supabase
    .from('compass_sections')
    .update({ sort_order: neighbour.sort_order })
    .eq('id', target.id)

  if (e3) return { success: false, error: 'Failed to reorder section.' }

  revalidatePath(`/workspace/${input.projectId}/compass`)
  return { success: true, data: undefined }
}
