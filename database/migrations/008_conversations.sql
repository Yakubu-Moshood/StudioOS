-- Sprint 12: AI Chat Panel
-- conversations: one per project (enforced via unique index)
-- messages: persisted exchange log; project_id denormalized for efficient RLS

CREATE TABLE IF NOT EXISTS public.conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Enforces single conversation per project; also guards concurrent creation race
CREATE UNIQUE INDEX conversations_project_id_unique_idx ON public.conversations (project_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: project owner access"
  ON public.conversations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversations.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = conversations.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid        NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  project_id       uuid        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  role             text        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- project_id is denormalized — enables single-hop RLS without joining through conversations
CREATE INDEX messages_conversation_id_idx ON public.messages (conversation_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: project owner access"
  ON public.messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = messages.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = messages.project_id
        AND projects.owner_id = auth.uid()
    )
  );
