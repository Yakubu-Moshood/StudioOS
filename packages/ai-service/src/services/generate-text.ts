import type { GenerateInput } from '../types/generate-input'
import type { GenerateOutput } from '../types/generate-output'
import { AnthropicProvider } from '../providers/anthropic-provider'

const provider = new AnthropicProvider()

export async function generate(input: GenerateInput): Promise<GenerateOutput> {
  return provider.generate(input)
}
