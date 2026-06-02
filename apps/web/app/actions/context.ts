'use server'

import { createClient } from '@/lib/supabase/server'
import { getContextSummary } from '@studioos/context-engine'
import type { ContextSummary } from '@studioos/context-engine'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function getProjectContextSummary(
  projectId: string
): Promise<ActionResult<ContextSummary>> {
  const supabase = await createClient()
  try {
    const summary = await getContextSummary(supabase, projectId)
    return { success: true, data: summary }
  } catch {
    return { success: false, error: 'Failed to assemble context.' }
  }
}
