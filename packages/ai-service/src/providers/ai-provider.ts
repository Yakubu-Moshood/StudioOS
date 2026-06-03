import type { GenerateInput } from '../types/generate-input'
import type { GenerateOutput } from '../types/generate-output'

export interface AIProvider {
  generate(input: GenerateInput): Promise<GenerateOutput>
}
