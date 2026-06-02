import type { SupabaseClient } from '@supabase/supabase-js'

export interface RemoveDependencyInput {
  dependencyId: string
  projectId: string
}

export async function removeDependency(
  client: SupabaseClient,
  input: RemoveDependencyInput
): Promise<{ success: true; data: undefined } | { success: false; error: string }> {
  const { error } = await client
    .from('artifact_dependencies')
    .delete()
    .eq('id', input.dependencyId)
    .eq('project_id', input.projectId)

  if (error) return { success: false, error: 'Failed to remove dependency.' }
  return { success: true, data: undefined }
}
