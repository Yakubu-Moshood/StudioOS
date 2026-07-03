'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PROJECT_FORMATS } from '@studioos/shared'
import type { Project, ProjectFormat } from '@studioos/shared'

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*').eq('id', id).single()
  return (data as Project) ?? null
}

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
type ProjectFilter = 'all' | 'active' | 'archived'

export async function getProjects(filter: ProjectFilter = 'active'): Promise<Project[]> {
  const supabase = await createClient()
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter === 'active') {
    query = query.is('archived_at', null)
  } else if (filter === 'archived') {
    query = query.not('archived_at', 'is', null)
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as Project[]
}

export async function renameProject(input: {
  projectId: string
  title: string
}): Promise<ActionResult<Project>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('projects')
    .update({ title })
    .eq('id', input.projectId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to rename project.' }

  revalidatePath('/dashboard')
  revalidatePath(`/workspace/${input.projectId}`)
  return { success: true, data: data as Project }
}

export async function archiveProject(input: {
  projectId: string
}): Promise<ActionResult<Project>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString(), status: 'archived' })
    .eq('id', input.projectId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to archive project.' }

  revalidatePath('/dashboard')
  revalidatePath(`/workspace/${input.projectId}`)
  return { success: true, data: data as Project }
}

export async function restoreProject(input: {
  projectId: string
}): Promise<ActionResult<Project>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('projects')
    .update({ archived_at: null, status: 'active' })
    .eq('id', input.projectId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error || !data) return { success: false, error: 'Failed to restore project.' }

  revalidatePath('/dashboard')
  revalidatePath(`/workspace/${input.projectId}`)
  return { success: true, data: data as Project }
}

export async function deleteProject(input: {
  projectId: string
}): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', input.projectId)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !project) {
    return { success: false, error: 'Project not found or access denied.' }
  }

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', input.projectId)
    .eq('owner_id', user.id)

  if (deleteError) return { success: false, error: 'Failed to delete project.' }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}

export async function createProject(input: {
  title: string
  format: ProjectFormat
}): Promise<ActionResult<Project>> {
  const title = input.title.trim()

  if (!title) return { success: false, error: 'Title is required.' }
  if (!(PROJECT_FORMATS as readonly string[]).includes(input.format)) {
    return { success: false, error: 'Invalid project format.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  let { data: organisation } = await supabase
    .from('organisations')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!organisation) {
    const { data: createdOrganisation, error: organisationError } = await supabase
      .from('organisations')
      .insert({ name: 'My Organisation', owner_id: user.id })
      .select('id')
      .single()

    if (organisationError || !createdOrganisation) {
      return { success: false, error: 'Failed to prepare project ownership.' }
    }

    organisation = createdOrganisation

    const { error: membershipError } = await supabase.from('organisation_members').insert({
      organisation_id: organisation.id,
      user_id: user.id,
      role: 'owner',
    })

    if (membershipError) {
      return { success: false, error: 'Failed to prepare project membership.' }
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      format: input.format,
      owner_id: user.id,
      organisation_id: organisation.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: 'Failed to create project.' }

  revalidatePath('/dashboard')
  return { success: true, data: data as Project }
}
