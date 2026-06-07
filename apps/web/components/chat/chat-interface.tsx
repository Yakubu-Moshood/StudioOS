'use client'

import { useOptimistic, useTransition, useRef, useEffect, useState } from 'react'
import { sendMessage } from '@/app/actions/chat'
import { toast } from 'sonner'
import type { Message } from '@studioos/shared'
import { MessageList } from './message-list'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MAX_LENGTH = 2000

interface ChatInterfaceProps {
  projectId: string
  initialMessages: Message[]
}

export function ChatInterface({ projectId, initialMessages }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [optimisticMessages, addOptimistic] = useOptimistic(
    initialMessages,
    (state: Message[], incoming: Message[]) => [...state, ...incoming]
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [optimisticMessages.length])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isPending) return

    setInput('')

    addOptimistic([
      {
        id: `opt-${Date.now()}`,
        conversation_id: '',
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ])

    startTransition(async () => {
      const result = await sendMessage({ projectId, content: trimmed })
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  const remaining = MAX_LENGTH - input.length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <MessageList messages={optimisticMessages} />
        {isPending && (
          <div className="mt-3 flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            placeholder="Ask anything about your project… (Enter to send, Shift+Enter for new line)"
            maxLength={MAX_LENGTH}
            rows={3}
            disabled={isPending}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {remaining < 200 ? `${remaining} characters remaining` : null}
            </span>
            <Button type="submit" size="sm" disabled={!input.trim() || isPending}>
              {isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
