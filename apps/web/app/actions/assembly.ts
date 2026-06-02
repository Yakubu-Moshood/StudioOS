'use server'

import { createClient } from '@/lib/supabase/server'
import { buildRequest, executeAssembly } from '@studioos/assembly-engine'
import type {
  AssemblyMode,
  AssemblyOptions,
  AssemblyRequest,
  AssemblyResult,
} from '@studioos/assembly-engine'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function buildAssemblyRequest(
  projectId: string,
  mode: AssemblyMode,
  userInstruction: string,
  options?: AssemblyOptions
): Promise<ActionResult<AssemblyRequest>> {
  const supabase = await createClient()
  try {
    const request = await buildRequest(supabase, projectId, mode, userInstruction, options)
    return { success: true, data: request }
  } catch {
    return { success: false, error: 'Failed to build assembly request.' }
  }
}

export async function executeProjectAssembly(
  projectId: string,
  mode: AssemblyMode,
  userInstruction: string,
  options?: AssemblyOptions
): Promise<ActionResult<AssemblyResult>> {
  const supabase = await createClient()
  try {
    const result = await executeAssembly(supabase, projectId, mode, userInstruction, options)
    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Failed to execute assembly.' }
  }
}
