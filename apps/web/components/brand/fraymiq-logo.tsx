interface FraymIQLogoProps {
  showPlatformLabel?: boolean
  compact?: boolean
  className?: string
}

export function FraymIQLogo({ showPlatformLabel = false, compact = false, className = '' }: FraymIQLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ee] shadow-sm ring-1 ring-[#cfe2dc]">
        <div className="absolute left-2 top-2 h-6 w-5 rounded-l-xl rounded-tr-xl bg-[#2f7f73]" />
        <div className="absolute left-3 top-4 h-2 w-5 rounded-full bg-white" />
        <div className="absolute bottom-2 left-3 h-4 w-3 rounded-b-xl rounded-tr-xl bg-[#4f9d8f]" />
      </div>
      {!compact ? (
        <div className="leading-none">
          <div className="text-xl font-semibold tracking-tight text-[#0f2433]">
            Fraym<span className="text-[#2f7f73]">IQ</span>
          </div>
          {showPlatformLabel ? <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[#6c7d86]">Platform</div> : null}
        </div>
      ) : null}
    </div>
  )
}
