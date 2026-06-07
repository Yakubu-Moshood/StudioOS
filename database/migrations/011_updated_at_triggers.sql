-- Sprint 14: updated_at trigger standardisation
-- Ensures updated_at is set automatically on every UPDATE across the five tables
-- identified in the carry-forward list. SECURITY INVOKER (default) — the function
-- only writes to NEW.updated_at and requires no elevated permissions.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
--   DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
--   DROP TRIGGER IF EXISTS set_updated_at ON public.project_core;
--   DROP TRIGGER IF EXISTS set_updated_at ON public.assets;
--   DROP TRIGGER IF EXISTS set_updated_at ON public.knowledge_entries;
--   DROP FUNCTION IF EXISTS public.set_updated_at();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- user_profiles
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects (rename, archive, restore all issue UPDATEs)
DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- project_core
DROP TRIGGER IF EXISTS set_updated_at ON public.project_core;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.project_core
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- assets
DROP TRIGGER IF EXISTS set_updated_at ON public.assets;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- knowledge_entries
DROP TRIGGER IF EXISTS set_updated_at ON public.knowledge_entries;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
