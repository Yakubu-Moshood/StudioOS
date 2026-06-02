export { addDependency } from './add'
export { removeDependency } from './remove'
export { getDependencies, getDependencyGraph } from './query'

export type { AddDependencyInput } from './add'
export type { RemoveDependencyInput } from './remove'
export type { GetDependenciesInput } from './query'

export type {
  ArtifactType,
  DependencyType,
  ArtifactRef,
  Dependency,
  DependencyGraph,
} from './types'
