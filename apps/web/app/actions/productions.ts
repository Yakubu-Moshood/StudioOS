'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Production, ProductionStage, ProductionTask, ProductionType } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export interface ProductionWorkflowView {
  production: Production
  stages: Array<ProductionStage & { tasks: ProductionTask[] }>
}

export async function getProductions(projectId: string): Promise<Production[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load productions.')
  return (data ?? []) as Production[]
}

export async function getProductionWorkflow(
  projectId: string,
  productionId: string
): Promise<ProductionWorkflowView | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: production, error: productionError } = await supabase
    .from('productions')
    .select('*')
    .eq('id', productionId)
    .eq('project_id', projectId)
    .single()

  if (productionError || !production) return null

  const { data: stages, error: stagesError } = await supabase
    .from('production_stages')
    .select('*, production_tasks(*)')
    .eq('production_id', productionId)
    .order('position', { ascending: true })

  if (stagesError) throw new Error('Failed to load production workflow.')

  const mappedStages = (stages ?? []).map((stage) => {
    const { production_tasks: tasks, ...stageRecord } = stage
    return {
      ...(stageRecord as ProductionStage),
      tasks: ((tasks ?? []) as ProductionTask[]).sort((a, b) => a.position - b.position),
    }
  })

  return {
    production: production as Production,
    stages: mappedStages,
  }
}

export async function createProduction(input: {
  projectId: string
  title: string
  productionType: ProductionType
}): Promise<ActionResult<Production>> {
  const title = input.title.trim()
  if (!title) return { success: false, error: 'Production title is required.' }

  const allowedTypes: ProductionType[] = [
    'advertising_campaign',
    'documentary',
    'explainer_video',
    'custom',
  ]
  if (!allowedTypes.includes(input.productionType)) {
    return { success: false, error: 'Choose a valid production type.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data, error } = await supabase.rpc('create_mvp_production', {
    target_project_id: input.projectId,
    production_title: title,
    selected_production_type: input.productionType,
  })

  if (error || !data) {
    return { success: false, error: 'Failed to create production.' }
  }

  const production = data as Production
  revalidatePath(`/workspace/${input.projectId}/productions`)
  return { success: true, data: production }
}
