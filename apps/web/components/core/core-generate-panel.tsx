interface CoreGeneratePanelProps {
  result: string
  isGenerating: boolean
}

export function CoreGeneratePanel({ result, isGenerating }: CoreGeneratePanelProps) {
  if (isGenerating) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Generating…</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        AI Output
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
    </div>
  )
}
