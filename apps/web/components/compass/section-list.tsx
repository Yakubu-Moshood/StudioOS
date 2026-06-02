import { SectionCard } from './section-card'
import type { CompassSection } from '@studioos/shared'

interface SectionListProps {
  sections: CompassSection[]
  projectId: string
}

export function SectionList({ sections, projectId }: SectionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          projectId={projectId}
          isFirst={index === 0}
          isLast={index === sections.length - 1}
        />
      ))}
    </div>
  )
}
