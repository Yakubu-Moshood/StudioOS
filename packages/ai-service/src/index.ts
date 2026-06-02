export interface GenerateInput {
  prompt: string
}

export interface GenerateOutput {
  text: string
}

export async function generate(input: GenerateInput): Promise<GenerateOutput> {
  return { text: `[ai-service stub] Received prompt of ${input.prompt.length} characters.` }
}
