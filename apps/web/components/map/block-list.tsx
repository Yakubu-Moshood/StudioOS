import type { Block } from '@studioos/shared'
import { BlockCard } from './block-card'

interface BlockListProps {
  blocks: Block[]
  projectId: string
}

export function BlockList({ blocks, projectId }: BlockListProps) {
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, index) => (
        <BlockCard
          key={block.id}
          block={block}
          projectId={projectId}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
        />
      ))}
    </div>
  )
}
