import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAssets } from '@/app/actions/assets'
import { AssetLibrary } from '@/components/assets/asset-library'
import type { AssetType } from '@studioos/shared'

export const metadata: Metadata = {
  title: 'Assets — StudioOS',
}

const ASSET_TYPES = new Set<string>(['image', 'video', 'audio', 'document', 'reference', 'other'])

interface AssetsPageProps {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function AssetsPage({ params, searchParams }: AssetsPageProps) {
  const { projectId } = await params
  const { type } = await searchParams

  const validType = type && ASSET_TYPES.has(type) ? (type as AssetType) : undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const assets = await getAssets({ projectId, type: validType })

  return (
    <AssetLibrary
      assets={assets}
      projectId={projectId}
      userId={user.id}
      activeType={validType}
    />
  )
}
