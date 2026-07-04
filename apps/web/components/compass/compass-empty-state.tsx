const STARTER_SECTIONS = [
  'Creative rules',
  'Audience promise',
  'Visual references',
  'Tone boundaries',
] as const

export function CompassEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#cbded8] bg-white/70 p-8 text-center shadow-sm sm:p-10">
      <p className="text-sm font-medium text-[#0f2433]">No compass sections yet.</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#667780]">
        Add your first section to define the creative rules, references, and boundaries for this project.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {STARTER_SECTIONS.map((section) => (
          <span key={section} className="rounded-full border border-[#e1e7e4] bg-white/80 px-3 py-1 text-xs text-[#667780]">
            {section}
          </span>
        ))}
      </div>
    </div>
  )
}
