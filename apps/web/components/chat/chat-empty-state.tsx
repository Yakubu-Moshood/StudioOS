export function ChatEmptyState() {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[#cbded8] bg-white/60 p-8 text-center">
      <p className="text-sm font-medium text-[#0f2433]">Ask your AI assistant</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#667780]">
        Ask about structure, tone, production planning, or the next useful step for this project.
      </p>
    </div>
  )
}
