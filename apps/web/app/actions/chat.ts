'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { executeProjectAssembly } from './assembly'
import type { Conversation, Message, MessageRole } from '@studioos/shared'

type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

interface ConversationRow {
  id: string
  project_id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface MessageRow {
  id: string
  conversation_id: string
  project_id: string
  role: string
  content: string
  created_at: string
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    role: row.role as MessageRole,
    content: row.content,
    created_at: row.created_at,
  }
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return (data ?? []).map((r) => rowToMessage(r as MessageRow))
}

// Lifecycle contract — sole entry point for all conversation access.
// Creates the conversation if it does not exist; handles concurrent creation race.
export async function getOrCreateConversation(projectId: string): Promise<Conversation> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  // Check for existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (existing) {
    const conv = existing as ConversationRow
    const messages = await fetchMessages(conv.id)
    return {
      id: conv.id,
      project_id: conv.project_id,
      user_id: userId,
      title: conv.title,
      messages,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
    }
  }

  // Create new conversation
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ project_id: projectId, title: null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Race condition: another concurrent request won the insert — re-fetch
      const { data: raceConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', projectId)
        .single()
      if (raceConv) {
        const conv = raceConv as ConversationRow
        const messages = await fetchMessages(conv.id)
        return {
          id: conv.id,
          project_id: conv.project_id,
          user_id: userId,
          title: conv.title,
          messages,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        }
      }
    }
    // Fallback: return an empty stub (non-fatal — sendMessage will also call this and catch)
    return {
      id: '',
      project_id: projectId,
      user_id: userId,
      title: null,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const conv = created as ConversationRow
  return {
    id: conv.id,
    project_id: conv.project_id,
    user_id: userId,
    title: conv.title,
    messages: [],
    created_at: conv.created_at,
    updated_at: conv.updated_at,
  }
}

// Sends a user message and returns the AI response.
// Calls getOrCreateConversation internally — no conversationId from client.
// Both messages are persisted only after the AI succeeds.
export async function sendMessage(input: {
  projectId: string
  content: string
}): Promise<ActionResult<{ userMessage: Message; assistantMessage: Message }>> {
  const { projectId, content } = input
  const trimmed = content.trim()

  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' }
  }

  // Lifecycle contract: resolve conversation server-side
  const conversation = await getOrCreateConversation(projectId)
  if (!conversation.id) {
    return { success: false, error: 'Failed to initialize conversation.' }
  }

  // AI call first — only persist if it succeeds
  const assemblyResult = await executeProjectAssembly(projectId, 'full_context', trimmed)
  if (!assemblyResult.success) {
    return { success: false, error: 'AI service unavailable. Please try again.' }
  }

  // Insert user message
  const { data: userRow, error: userError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      project_id: projectId,
      role: 'user',
      content: trimmed,
    })
    .select()
    .single()

  if (userError || !userRow) {
    return { success: false, error: 'Failed to save message.' }
  }

  // Insert assistant message
  const { data: assistantRow, error: assistantError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      project_id: projectId,
      role: 'assistant',
      content: assemblyResult.data.response,
    })
    .select()
    .single()

  if (assistantError || !assistantRow) {
    // Keep consistency: remove the orphaned user message
    await supabase.from('messages').delete().eq('id', userRow.id)
    return { success: false, error: 'Failed to save AI response.' }
  }

  revalidatePath(`/workspace/${projectId}/ai`)

  return {
    success: true,
    data: {
      userMessage: rowToMessage(userRow as MessageRow),
      assistantMessage: rowToMessage(assistantRow as MessageRow),
    },
  }
}
