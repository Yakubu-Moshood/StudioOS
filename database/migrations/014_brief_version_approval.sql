-- Phase 1 Brief gate
-- Adds transactional functions for immutable Brief versions and version-specific decisions.

CREATE OR REPLACE FUNCTION public.create_brief_version(
  target_production_id uuid,
  brief_content jsonb
)
RETURNS public.artifact_versions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  brief_artifact public.artifacts;
  next_version integer;
  created_version public.artifact_versions;
  brief_stage_id uuid;
  research_stage_id uuid;
  brief_task_id uuid;
  research_task_id uuid;
BEGIN
  IF brief_content IS NULL OR brief_content = '{}'::jsonb THEN
    RAISE EXCEPTION 'Brief content is required';
  END IF;

  SELECT id INTO brief_stage_id
  FROM public.production_stages
  WHERE production_id = target_production_id AND stage_key = 'brief';

  SELECT id INTO research_stage_id
  FROM public.production_stages
  WHERE production_id = target_production_id AND stage_key = 'research';

  IF brief_stage_id IS NULL OR research_stage_id IS NULL THEN
    RAISE EXCEPTION 'Required workflow stages not found';
  END IF;

  SELECT id INTO brief_task_id
  FROM public.production_tasks
  WHERE stage_id = brief_stage_id AND task_key = 'create_brief';

  SELECT id INTO research_task_id
  FROM public.production_tasks
  WHERE stage_id = research_stage_id AND task_key = 'generate_research';

  INSERT INTO public.artifacts (production_id, artifact_type, title)
  VALUES (target_production_id, 'brief', 'Production Brief')
  ON CONFLICT (production_id, artifact_type)
  DO UPDATE SET title = EXCLUDED.title
  RETURNING * INTO brief_artifact;

  -- Serialise version allocation per Artifact so concurrent saves cannot claim
  -- the same version number.
  PERFORM 1
  FROM public.artifacts
  WHERE id = brief_artifact.id
  FOR UPDATE;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.artifact_versions
  WHERE artifact_id = brief_artifact.id;

  INSERT INTO public.artifact_versions (
    artifact_id, version_number, content, created_by
  ) VALUES (
    brief_artifact.id, next_version, brief_content, auth.uid()
  )
  RETURNING * INTO created_version;

  UPDATE public.production_stages
  SET status = 'awaiting_approval'
  WHERE id = brief_stage_id;

  UPDATE public.production_tasks
  SET status = 'awaiting_approval'
  WHERE id = brief_task_id;

  -- A new authoritative Brief version invalidates the downstream readiness
  -- granted by an older approved Brief version.
  UPDATE public.production_stages
  SET status = 'pending'
  WHERE id = research_stage_id;

  UPDATE public.production_tasks
  SET status = 'pending'
  WHERE id = research_task_id;

  UPDATE public.productions
  SET state = 'awaiting_approval'
  WHERE id = target_production_id
    AND state NOT IN ('completed', 'cancelled');

  INSERT INTO public.production_events (
    production_id, event_type, actor_id, entity_type, entity_id, payload
  ) VALUES (
    target_production_id,
    'artifact.version_created',
    auth.uid(),
    'artifact_version',
    created_version.id,
    jsonb_build_object(
      'artifact_type', 'brief',
      'version_number', created_version.version_number
    )
  );

  RETURN created_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_brief_version(
  target_artifact_version_id uuid,
  approval_decision text,
  decision_comment text DEFAULT NULL
)
RETURNS public.approvals
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  created_approval public.approvals;
  target_production_id uuid;
  target_artifact_id uuid;
  target_version_number integer;
  latest_version_number integer;
  brief_stage_id uuid;
  research_stage_id uuid;
  brief_task_id uuid;
  research_task_id uuid;
BEGIN
  IF approval_decision NOT IN ('approved', 'revision_requested') THEN
    RAISE EXCEPTION 'Invalid approval decision';
  END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version_number
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id
    AND a.artifact_type = 'brief';

  IF target_production_id IS NULL THEN
    RAISE EXCEPTION 'Brief version not found';
  END IF;

  SELECT MAX(version_number)
  INTO latest_version_number
  FROM public.artifact_versions
  WHERE artifact_id = target_artifact_id;

  IF target_version_number <> latest_version_number THEN
    RAISE EXCEPTION 'Only the latest Brief version may be decided';
  END IF;

  -- Decisions are immutable. A changed outcome requires a new Artifact Version.
  INSERT INTO public.approvals (
    artifact_version_id, decision, comment, decided_by
  ) VALUES (
    target_artifact_version_id,
    approval_decision,
    NULLIF(trim(decision_comment), ''),
    auth.uid()
  )
  RETURNING * INTO created_approval;

  SELECT id INTO brief_stage_id
  FROM public.production_stages
  WHERE production_id = target_production_id AND stage_key = 'brief';

  SELECT id INTO research_stage_id
  FROM public.production_stages
  WHERE production_id = target_production_id AND stage_key = 'research';

  SELECT id INTO brief_task_id
  FROM public.production_tasks
  WHERE stage_id = brief_stage_id AND task_key = 'create_brief';

  SELECT id INTO research_task_id
  FROM public.production_tasks
  WHERE stage_id = research_stage_id AND task_key = 'generate_research';

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status = 'completed' WHERE id = brief_stage_id;
    UPDATE public.production_tasks SET status = 'completed' WHERE id = brief_task_id;
    UPDATE public.production_stages SET status = 'ready' WHERE id = research_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = research_task_id;
    UPDATE public.productions
    SET state = 'ready'
    WHERE id = target_production_id
      AND state NOT IN ('completed', 'cancelled');
  ELSE
    UPDATE public.production_stages SET status = 'active' WHERE id = brief_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = brief_task_id;
    UPDATE public.production_stages SET status = 'pending' WHERE id = research_stage_id;
    UPDATE public.production_tasks SET status = 'pending' WHERE id = research_task_id;
    UPDATE public.productions
    SET state = 'active'
    WHERE id = target_production_id
      AND state NOT IN ('completed', 'cancelled');
  END IF;

  INSERT INTO public.production_events (
    production_id, event_type, actor_id, entity_type, entity_id, payload
  ) VALUES (
    target_production_id,
    CASE
      WHEN approval_decision = 'approved' THEN 'artifact_version.approved'
      ELSE 'artifact_version.revision_requested'
    END,
    auth.uid(),
    'artifact_version',
    target_artifact_version_id,
    jsonb_build_object('artifact_type', 'brief', 'decision', approval_decision)
  );

  RETURN created_approval;
END;
$$;
