-- Sprint 13: Knowledge Base Panel
-- knowledge_entries stores per-project research notes, references, and documents.
--
-- Ownership model:
--   user_id   = attribution field — records who created the entry (set from auth.getUser() on insert)
--   project_id = ownership gate — RLS uses project_id → projects.owner_id (Pattern B)
--               consistent with project_core, compass_sections, blocks, conversations, messages

CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid        NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users (id)    ON DELETE CASCADE,
  title        text        NOT NULL,
  content      text,
  type         text        NOT NULL DEFAULT 'text'
               CHECK (type IN ('text', 'document', 'url', 'other')),
  source_url   text,
  source_title text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_entries_project_id_idx
  ON public.knowledge_entries (project_id);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Pattern B: ownership via project → projects.owner_id
-- user_id is stored for attribution but is not part of the RLS condition
CREATE POLICY "knowledge_entries: project owner access"
  ON public.knowledge_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = knowledge_entries.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = knowledge_entries.project_id
        AND projects.owner_id = auth.uid()
    )
  );
