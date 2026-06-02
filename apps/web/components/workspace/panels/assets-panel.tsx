export function AssetsPanel() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-base font-semibold">Assets</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Reference library — images, documents, and external references for this project.
        </p>
      </div>
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">Asset library — coming in Sprint 4.</p>
      </div>
    </div>
  )
}
