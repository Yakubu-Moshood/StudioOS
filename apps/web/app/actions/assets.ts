'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Asset, AssetType } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export type AssetWithSignedUrl = Asset & { signedUrl: string | null }

export async function getAssets(input: {
  projectId: string
  type: AssetType | undefined
}): Promise<AssetWithSignedUrl[]> {
  const supabase = await createClient()

  let query = supabase
    .from('assets')
    .select('*')
    .eq('project_id', input.projectId)
    .order('created_at', { ascending: false })

  if (input.type) {
    query = query.eq('type', input.type)
  }

  const { data, error } = await query
  if (error || !data) return []

  const assets = data as Asset[]

  const withSignedUrls = await Promise.all(
    assets.map(async (asset) => {
      if (asset.source_type !== 'uploaded' || !asset.storage_path) {
        return { ...asset, signedUrl: null }
      }

      const { data: signed } = await supabase.storage
        .from('assets')
        .createSignedUrl(asset.storage_path, 3600)

      return { ...asset, signedUrl: signed?.signedUrl ?? null }
    })
  )

  return withSignedUrls
}

export async function uploadAsset(input: {
  projectId: string
  assetId: string
  storagePath: string
  name: string
  type: AssetType
  mimeType: string | null
  size: number | null
}): Promise<ActionResult<Asset>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      id: input.assetId,
      project_id: input.projectId,
      owner_id: user.id,
      name: input.name,
      type: input.type,
      source: 'upload',
      source_type: 'uploaded',
      storage_path: input.storagePath,
      external_url: null,
      size: input.size,
      mime_type: input.mimeType,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to save asset record.' }
  }

  revalidatePath(`/workspace/${input.projectId}/assets`)
  return { success: true, data: data as Asset }
}

export async function addReference(input: {
  projectId: string
  url: string
  name: string
  notes: string | null
}): Promise<ActionResult<Asset>> {
  try {
    new URL(input.url)
  } catch {
    return { success: false, error: 'Invalid URL.' }
  }

  const name = input.name.trim()
  if (!name) {
    return { success: false, error: 'Name is required.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      project_id: input.projectId,
      owner_id: user.id,
      name,
      type: 'reference',
      source: 'external',
      source_type: 'external',
      storage_path: null,
      external_url: input.url,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to save reference.' }
  }

  revalidatePath(`/workspace/${input.projectId}/assets`)
  return { success: true, data: data as Asset }
}

export async function deleteAsset(input: {
  assetId: string
  projectId: string
  storagePath: string | null
}): Promise<ActionResult<void>> {
  const supabase = await createClient()

  if (input.storagePath) {
    const { error: storageError } = await supabase.storage
      .from('assets')
      .remove([input.storagePath])

    if (storageError) {
      return { success: false, error: 'Failed to delete storage file. Please try again.' }
    }
  }

  const { error: dbError } = await supabase
    .from('assets')
    .delete()
    .eq('id', input.assetId)

  if (dbError) {
    return { success: false, error: 'Failed to delete asset record.' }
  }

  revalidatePath(`/workspace/${input.projectId}/assets`)
  return { success: true, data: undefined }
}
