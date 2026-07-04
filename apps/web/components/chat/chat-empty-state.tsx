const STARTER_PROMPTS = [
  'What is the next useful step for this project?',
  'What should I clarify before creating a production?',
  'Review the project tone and suggest improvements.',
] as const

export function ChatEmptyState() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[#cbded8] bg-white/60 p-8 text-center">
      <p className="text-sm font-medium text-[#0f2433]">Ask your AI assistant</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#667780]">
        Ask about structure, tone, production planning, or the next useful step for this project.
      </p>
      <div className="mt-5 grid w-full max-w-xl gap-2 text-left sm:grid-cols-3">
        {STARTER_PROMPTS.map((prompt) => (
          <div key={prompt} className="rounded-2xl border border-[#e1e7e4] bg-white/80 p-3 text-xs leading-5 text-[#667780]">
            {prompt}
          </div>
        ))}
      </div>
    </div>
  )
}
