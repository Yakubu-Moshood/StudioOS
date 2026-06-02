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

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as Project[]
}

export async function createProject(input: {
  title: string
  format: ProjectFormat
}): Promise<ActionResult<Project>> {
  const title = input.title.trim()

  if (!title) {
    return { success: false, error: 'Title is required.' }
  }

  if (!(PROJECT_FORMATS as readonly string[]).includes(input.format)) {
    return { success: false, error: 'Invalid project format.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ title, format: input.format, owner_id: user.id })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to create project.' }
  }

  revalidatePath('/dashboard')
  return { success: true, data: data as Project }
}
