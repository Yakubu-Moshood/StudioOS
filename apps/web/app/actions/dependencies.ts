'use server'

import { createClient } from '@/lib/supabase/server'
import {
  addDependency,
  removeDependency,
  getDependencies,
  getDependencyGraph,
} from '@studioos/dependency-engine'
import type {
  AddDependencyInput,
  Dependency,
  DependencyGraph,
  GetDependenciesInput,
  RemoveDependencyInput,
} from '@studioos/dependency-engine'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

export async function addProjectDependency(
  input: AddDependencyInput
): Promise<ActionResult<Dependency>> {
  const supabase = await createClient()
  return addDependency(supabase, input)
}

export async function removeProjectDependency(
  input: RemoveDependencyInput
): Promise<ActionResult<undefined>> {
  const supabase = await createClient()
  return removeDependency(supabase, input)
}

export async function getProjectDependencies(
  input: GetDependenciesInput
): Promise<ActionResult<Dependency[]>> {
  const supabase = await createClient()
  const deps = await getDependencies(supabase, input)
  return { success: true, data: deps }
}

export async function getProjectDependencyGraph(
  projectId: string
): Promise<ActionResult<DependencyGraph>> {
  const supabase = await createClient()
  const graph = await getDependencyGraph(supabase, projectId)
  return { success: true, data: graph }
}
