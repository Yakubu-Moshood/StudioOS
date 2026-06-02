'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const FILTERS = [
  { label: 'All',        value: undefined    },
  { label: 'Images',     value: 'image'      },
  { label: 'Video',      value: 'video'      },
  { label: 'Audio',      value: 'audio'      },
  { label: 'Documents',  value: 'document'   },
  { label: 'References', value: 'reference'  },
] as const

interface AssetTypeFilterProps {
  activeType: string | undefined
}

export function AssetTypeFilter({ activeType }: AssetTypeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('type', value)
    } else {
      params.delete('type')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1">
      {FILTERS.map(({ label, value }) => (
        <button
          key={label}
          onClick={() => handleSelect(value)}
          className={[
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            (activeType ?? undefined) === value
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
