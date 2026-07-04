'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveProjectCore } from '@/app/actions/core'
import { executeProjectAssembly } from '@/app/actions/assembly'
import { toast } from 'sonner'
import { CoreGeneratePanel } from './core-generate-panel'
import type { ProjectCore, Genre, Tone } from '@studioos/shared'

const GENRE_OPTIONS: { value: Genre; label: string }[] = [
  { value: 'drama',       label: 'Drama'       },
  { value: 'comedy',      label: 'Comedy'      },
  { value: 'thriller',    label: 'Thriller'    },
  { value: 'horror',      label: 'Horror'      },
  { value: 'action',      label: 'Action'      },
  { value: 'romance',     label: 'Romance'     },
  { value: 'documentary', label: 'Documentary' },
  { value: 'other',       label: 'Other'       },
]

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'dark',      label: 'Dark'      },
  { value: 'light',     label: 'Light'     },
  { value: 'satirical', label: 'Satirical' },
  { value: 'dramatic',  label: 'Dramatic'  },
  { value: 'comedic',   label: 'Comedic'   },
  { value: 'neutral',   label: 'Neutral'   },
  { value: 'other',     label: 'Other'     },
]

const NONE_VALUE = '__none__'

function toSelectValue(value: string | null): string {
  return value ?? NONE_VALUE
}

function fromSelectValue(value: string): string | null {
  return value === NONE_VALUE ? null : value
}

interface CoreFormProps {
  projectId: string
  initialCore: ProjectCore | null
}

export function CoreForm({ projectId, initialCore }: CoreFormProps) {
  const [synopsis, setSynopsis] = useState(initialCore?.synopsis ?? '')
  const [genre, setGenre] = useState<Genre | null>(initialCore?.genre ?? null)
  const [tone, setTone] = useState<Tone | null>(initialCore?.tone ?? null)
  const [themes, setThemes] = useState(initialCore?.themes.join(', ') ?? '')
  const [userInstruction, setUserInstruction] = useState('')
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  const [isSavePending, startSaveTransition] = useTransition()
  const [isGenerating, startGenerateTransition] = useTransition()

  const isAnyPending = isSavePending || isGenerating

  function handleSave() {
    startSaveTransition(async () => {
      const result = await saveProjectCore({
        projectId,
        synopsis,
        genre,
        tone,
        themes,
      })
      if (result.success) {
        toast.success('Core saved.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleGenerate() {
    startGenerateTransition(async () => {
      const result = await executeProjectAssembly(projectId, 'core_only', userInstruction)
      if (result.success) {
        setGenerateResult(result.data.response)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Project details</h2>
          <p className="mt-1 text-sm text-[#667780]">Keep the foundation clear before production begins.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea
              id="synopsis"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="A brief summary of your project…"
              rows={4}
              disabled={isAnyPending}
              className="resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={toSelectValue(genre)}
                onValueChange={(v) => setGenre(fromSelectValue(v) as Genre | null)}
                disabled={isAnyPending}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {GENRE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={toSelectValue(tone)}
                onValueChange={(v) => setTone(fromSelectValue(v) as Tone | null)}
                disabled={isAnyPending}
              >
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {TONE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="themes">Themes</Label>
            <Input
              id="themes"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
              placeholder="e.g. redemption, identity, loss"
              disabled={isAnyPending}
            />
            <p className="text-xs text-[#667780]">Separate themes with commas.</p>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleSave} disabled={isAnyPending}>
              {isSavePending ? 'Saving…' : 'Save core'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Generate with AI</h2>
            <p className="mt-1 text-sm text-[#667780]">
              Get suggestions based on your core data.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-instruction">Instruction</Label>
            <Textarea
              id="user-instruction"
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              placeholder="Optional — e.g. Suggest improvements to the synopsis and themes."
              rows={3}
              disabled={isAnyPending}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerate}
              disabled={isAnyPending}
            >
              {isGenerating ? 'Generating…' : 'Generate'}
            </Button>
          </div>

          {(isGenerating || generateResult !== null) && (
            <CoreGeneratePanel
              result={generateResult ?? ''}
              isGenerating={isGenerating}
            />
          )}
        </div>
      </div>
    </div>
  )
}
