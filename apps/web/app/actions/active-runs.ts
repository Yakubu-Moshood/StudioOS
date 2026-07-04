'use server'

import { createClient } from '@/lib/supabase/server'
import type { Run } from '@studioos/shared'

export async function getActiveProductionRun(
  productionId: string,
  jobType: 'video_generation' | 'post_production' | 'delivery'
): Promise<Run | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_active_production_run', {
    target_production_id: productionId,
    target_job_type: jobType,
  })

  if (error) throw new Error(`Failed to recover active ${jobType.replace('_', ' ')} run.`)
  return (data as Run | null) ?? null
}
