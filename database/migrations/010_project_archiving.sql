-- Sprint 14: Project Archiving
-- Adds archived_at to projects. Archived state is determined by archived_at IS NOT NULL.
--
-- Ownership model unchanged — RLS remains auth.uid() = owner_id.
-- Archive status affects Dashboard organisation only; all workspace panels remain accessible.
--
-- Rollback: ALTER TABLE public.projects DROP COLUMN archived_at;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
