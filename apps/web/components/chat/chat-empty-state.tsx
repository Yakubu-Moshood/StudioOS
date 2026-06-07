export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-foreground">Ask your AI assistant</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Ask anything about your project — structure, story, tone, next steps.
      </p>
    </div>
  )
}
