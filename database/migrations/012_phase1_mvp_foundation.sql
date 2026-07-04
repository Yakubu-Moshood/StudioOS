-- Phase 1 MVP foundation
-- Adds Organisation -> Project -> Production ownership and the fixed four-stage workflow.
-- This is additive: existing project-owned creative records remain unchanged.

CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);

CREATE TABLE IF NOT EXISTS public.organisation_members (
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organisation_id, user_id)
);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisations(id) ON DELETE RESTRICT;

INSERT INTO public.organisations (name, owner_id)
SELECT 'My Organisation', p.owner_id
FROM public.projects p
LEFT JOIN public.organisations o ON o.owner_id = p.owner_id
WHERE o.id IS NULL
GROUP BY p.owner_id;

INSERT INTO public.organisation_members (organisation_id, user_id, role)
SELECT o.id, o.owner_id, 'owner'
FROM public.organisations o
ON CONFLICT (organisation_id, user_id) DO NOTHING;

UPDATE public.projects p
SET organisation_id = o.id
FROM public.organisations o
WHERE p.owner_id = o.owner_id
  AND p.organisation_id IS NULL;

CREATE TABLE IF NOT EXISTS public.productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  state text NOT NULL DEFAULT 'draft' CHECK (
    state IN ('draft', 'ready', 'active', 'awaiting_approval', 'paused', 'blocked', 'completed', 'cancelled')
  ),
  workflow_key text NOT NULL DEFAULT 'mvp_v1' CHECK (workflow_key = 'mvp_v1'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.production_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  stage_key text NOT NULL CHECK (stage_key IN ('brief', 'research', 'script', 'production_package')),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 4),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'ready', 'active', 'awaiting_approval', 'completed', 'blocked')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (production_id, stage_key),
  UNIQUE (production_id, position)
);

CREATE TABLE IF NOT EXISTS public.production_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.production_stages(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'ready', 'active', 'awaiting_approval', 'completed', 'failed', 'blocked', 'cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, task_key)
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.production_tasks(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')
  ),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  attempt integer NOT NULL CHECK (attempt > 0),
  status text NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'succeeded', 'failed', 'cancelled')
  ),
  provider text,
  model text,
  provider_request_id text,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (job_id, attempt)
);

CREATE TABLE IF NOT EXISTS public.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  artifact_type text NOT NULL CHECK (
    artifact_type IN ('brief', 'research', 'script', 'production_package')
  ),
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (production_id, artifact_type)
);

CREATE TABLE IF NOT EXISTS public.artifact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  version_number integer NOT NULL CHECK (version_number > 0),
  content jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  source_run_id uuid REFERENCES public.runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artifact_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_version_id uuid NOT NULL REFERENCES public.artifact_versions(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved', 'revision_requested')),
  comment text,
  decided_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artifact_version_id)
);

CREATE TABLE IF NOT EXISTS public.production_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS productions_project_id_idx ON public.productions(project_id);
CREATE INDEX IF NOT EXISTS production_stages_production_id_idx ON public.production_stages(production_id);
CREATE INDEX IF NOT EXISTS production_tasks_stage_id_idx ON public.production_tasks(stage_id);
CREATE INDEX IF NOT EXISTS jobs_task_id_idx ON public.jobs(task_id);
CREATE INDEX IF NOT EXISTS runs_job_id_idx ON public.runs(job_id);
CREATE INDEX IF NOT EXISTS artifacts_production_id_idx ON public.artifacts(production_id);
CREATE INDEX IF NOT EXISTS artifact_versions_artifact_id_idx ON public.artifact_versions(artifact_id);
CREATE INDEX IF NOT EXISTS production_events_production_id_created_at_idx
  ON public.production_events(production_id, created_at DESC);

DROP TRIGGER IF EXISTS set_updated_at ON public.organisations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.productions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.productions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.production_stages;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.production_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.production_tasks;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.jobs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.artifacts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_organisation_member(target_organisation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organisation_members om
    WHERE om.organisation_id = target_organisation_id
      AND om.user_id = auth.uid()
  );
$$;

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY organisations_member_access ON public.organisations
  FOR ALL USING (public.is_organisation_member(id))
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY organisation_members_member_read ON public.organisation_members
  FOR SELECT USING (public.is_organisation_member(organisation_id));

CREATE POLICY organisation_members_owner_write ON public.organisation_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.owner_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organisations o
      WHERE o.id = organisation_id AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY productions_member_access ON public.productions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY production_stages_member_access ON public.production_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY production_tasks_member_access ON public.production_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.production_stages ps
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE ps.id = stage_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.production_stages ps
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE ps.id = stage_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY jobs_member_access ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.production_tasks pt
      JOIN public.production_stages ps ON ps.id = pt.stage_id
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pt.id = task_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.production_tasks pt
      JOIN public.production_stages ps ON ps.id = pt.stage_id
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pt.id = task_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY runs_member_access ON public.runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.production_tasks pt ON pt.id = j.task_id
      JOIN public.production_stages ps ON ps.id = pt.stage_id
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE j.id = job_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.production_tasks pt ON pt.id = j.task_id
      JOIN public.production_stages ps ON ps.id = pt.stage_id
      JOIN public.productions pr ON pr.id = ps.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE j.id = job_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY artifacts_member_access ON public.artifacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY artifact_versions_member_access ON public.artifact_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.artifacts a
      JOIN public.productions pr ON pr.id = a.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE a.id = artifact_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artifacts a
      JOIN public.productions pr ON pr.id = a.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE a.id = artifact_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY approvals_member_access ON public.approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.artifact_versions av
      JOIN public.artifacts a ON a.id = av.artifact_id
      JOIN public.productions pr ON pr.id = a.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE av.id = artifact_version_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.artifact_versions av
      JOIN public.artifacts a ON a.id = av.artifact_id
      JOIN public.productions pr ON pr.id = a.production_id
      JOIN public.projects p ON p.id = pr.project_id
      WHERE av.id = artifact_version_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE POLICY production_events_member_access ON public.production_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.productions pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE pr.id = production_id
        AND public.is_organisation_member(p.organisation_id)
    )
  );

CREATE OR REPLACE FUNCTION public.create_mvp_production(
  target_project_id uuid,
  production_title text
)
RETURNS public.productions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  created_production public.productions;
  brief_stage_id uuid;
  research_stage_id uuid;
  script_stage_id uuid;
  package_stage_id uuid;
BEGIN
  IF char_length(trim(production_title)) = 0 THEN
    RAISE EXCEPTION 'Production title is required';
  END IF;

  INSERT INTO public.productions (project_id, title, created_by)
  VALUES (target_project_id, trim(production_title), auth.uid())
  RETURNING * INTO created_production;

  INSERT INTO public.production_stages (production_id, stage_key, position, status)
  VALUES (created_production.id, 'brief', 1, 'ready')
  RETURNING id INTO brief_stage_id;

  INSERT INTO public.production_stages (production_id, stage_key, position)
  VALUES (created_production.id, 'research', 2)
  RETURNING id INTO research_stage_id;

  INSERT INTO public.production_stages (production_id, stage_key, position)
  VALUES (created_production.id, 'script', 3)
  RETURNING id INTO script_stage_id;

  INSERT INTO public.production_stages (production_id, stage_key, position)
  VALUES (created_production.id, 'production_package', 4)
  RETURNING id INTO package_stage_id;

  INSERT INTO public.production_tasks (stage_id, task_key, title, status)
  VALUES
    (brief_stage_id, 'create_brief', 'Create production brief', 'ready'),
    (research_stage_id, 'generate_research', 'Generate research', 'pending'),
    (script_stage_id, 'generate_script', 'Generate script', 'pending'),
    (package_stage_id, 'assemble_production_package', 'Assemble production package', 'pending');

  INSERT INTO public.production_events (
    production_id, event_type, actor_id, entity_type, entity_id, payload
  ) VALUES (
    created_production.id,
    'production.created',
    auth.uid(),
    'production',
    created_production.id,
    jsonb_build_object('workflow_key', created_production.workflow_key)
  );

  RETURN created_production;
END;
$$;
