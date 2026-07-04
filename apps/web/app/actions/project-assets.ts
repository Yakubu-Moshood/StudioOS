'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ProjectAsset {
  id: string
  project_id: string
  owner_id: string
  file_name: string
  file_url: string
  storage_path: string
  content_type: string | null
  file_size: number | null
  created_at: string
}

export async function getProjectAssets(projectId: string): Promise<ProjectAsset[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load project assets.')
  return (data ?? []) as ProjectAsset[]
}

export async function addProjectAsset(input: {
  projectId: string
  fileName: string
  fileUrl: string
  storagePath: string
  contentType?: string | null
  fileSize?: number | null
}): Promise<ActionResult<ProjectAsset>> {
  const fileName = input.fileName.trim()
  const fileUrl = input.fileUrl.trim()
  const storagePath = input.storagePath.trim()

  if (!fileName || !fileUrl || !storagePath) {
    return { success: false, error: 'File details are incomplete.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('project_assets')
    .insert({
      project_id: input.projectId,
      owner_id: user.id,
      file_name: fileName,
      file_url: fileUrl,
      storage_path: storagePath,
      content_type: input.contentType ?? null,
      file_size: input.fileSize ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    return { success: false, error: 'Failed to save project asset.' }
  }

  revalidatePath(`/workspace/${input.projectId}/assets`)
  return { success: true, data: data as ProjectAsset }
}
