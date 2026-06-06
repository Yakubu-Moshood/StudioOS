'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProjectCore, Genre, Tone } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getProjectCore(projectId: string): Promise<ProjectCore | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('project_core')
    .select('*')
    .eq('project_id', projectId)
    .single()
  return (data as ProjectCore) ?? null
}

export async function saveProjectCore(input: {
  projectId: string
  synopsis: string
  genre: Genre | null
  tone: Tone | null
  themes: string
}): Promise<ActionResult<ProjectCore>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const themes = input.themes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const { data, error } = await supabase
    .from('project_core')
    .upsert(
      {
        project_id: input.projectId,
        synopsis: input.synopsis.trim(),
        genre: input.genre,
        tone: input.tone,
        themes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    )
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to save core data.' }
  }

  revalidatePath(`/workspace/${input.projectId}/core`)
  return { success: true, data: data as ProjectCore }
}
