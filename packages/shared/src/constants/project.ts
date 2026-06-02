import type { ProjectFormat, ProjectStatus } from '../types/project'

export const PROJECT_FORMATS: readonly ProjectFormat[] = [
  'Film',
  'Series',
  'Commercial',
  'Documentary',
  'YouTube',
  'Other',
] as const

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  'active',
  'archived',
] as const
