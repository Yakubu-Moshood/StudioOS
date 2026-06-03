import Anthropic from '@anthropic-ai/sdk'
import type { GenerateInput } from '../types/generate-input'
import type { GenerateOutput } from '../types/generate-output'
import type { AIProvider } from './ai-provider'

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'
const PROVIDER_NAME = 'anthropic'

export class AnthropicProvider implements AIProvider {
  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set.')
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: input.maxTokens ?? 1024,
      messages: [{ role: 'user', content: input.prompt }],
      ...(input.systemPrompt !== undefined ? { system: input.systemPrompt } : {}),
    })

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      model: message.model,
      provider: PROVIDER_NAME,
    }
  }
}
