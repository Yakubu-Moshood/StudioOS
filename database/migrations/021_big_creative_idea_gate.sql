ALTER TABLE public.artifacts DROP CONSTRAINT IF EXISTS artifacts_artifact_type_check;
ALTER TABLE public.artifacts ADD CONSTRAINT artifacts_artifact_type_check CHECK (artifact_type IN ('brief','research','script','production_package','big_creative_idea'));

CREATE OR REPLACE FUNCTION public.create_creative_stage_version(
  target_production_id uuid,
  target_stage_key text,
  target_artifact_type text,
  artifact_title text,
  artifact_content jsonb
)
RETURNS public.artifact_versions
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_stage public.production_stages;
  target_artifact_id uuid;
  next_version integer;
  created_version public.artifact_versions;
BEGIN
  SELECT * INTO target_stage
  FROM public.production_stages
  WHERE production_id = target_production_id
    AND stage_key = target_stage_key;

  IF target_stage.id IS NULL THEN RAISE EXCEPTION 'Stage not found'; END IF;
  IF target_stage.status NOT IN ('ready','active') THEN RAISE EXCEPTION 'Stage is not ready'; END IF;

  INSERT INTO public.artifacts (production_id, artifact_type, title)
  VALUES (target_production_id, target_artifact_type, artifact_title)
  ON CONFLICT (production_id, artifact_type)
  DO UPDATE SET title = EXCLUDED.title, updated_at = now()
  RETURNING id INTO target_artifact_id;

  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.artifact_versions
  WHERE artifact_id = target_artifact_id;

  INSERT INTO public.artifact_versions (artifact_id, version_number, content, created_by)
  VALUES (target_artifact_id, next_version, artifact_content, auth.uid())
  RETURNING * INTO created_version;

  UPDATE public.production_stages SET status = 'awaiting_approval' WHERE id = target_stage.id;
  UPDATE public.production_tasks SET status = 'awaiting_approval' WHERE stage_id = target_stage.id;
  UPDATE public.productions SET state = 'awaiting_approval' WHERE id = target_production_id;

  RETURN created_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_creative_stage_version(
  target_artifact_version_id uuid,
  target_stage_key text,
  approval_decision text,
  decision_comment text DEFAULT NULL
)
RETURNS public.approvals
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  created_approval public.approvals;
  target_production_id uuid;
  target_artifact_id uuid;
  target_version integer;
  latest_version integer;
  stage_id uuid;
  next_stage_id uuid;
BEGIN
  IF approval_decision NOT IN ('approved','revision_requested') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id;

  SELECT MAX(version_number) INTO latest_version
  FROM public.artifact_versions
  WHERE artifact_id = target_artifact_id;

  IF target_version <> latest_version THEN RAISE EXCEPTION 'Only latest version may be decided'; END IF;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (target_artifact_version_id, approval_decision, NULLIF(trim(decision_comment), ''), auth.uid())
  RETURNING * INTO created_approval;

  SELECT id INTO stage_id FROM public.production_stages
  WHERE production_id = target_production_id AND stage_key = target_stage_key;

  SELECT id INTO next_stage_id FROM public.production_stages
  WHERE production_id = target_production_id
    AND position = (SELECT position + 1 FROM public.production_stages WHERE id = stage_id);

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status='completed' WHERE id=stage_id;
    UPDATE public.production_tasks SET status='completed' WHERE stage_id=stage_id;
    UPDATE public.production_stages SET status='ready' WHERE id=next_stage_id;
    UPDATE public.production_tasks SET status='ready' WHERE stage_id=next_stage_id;
    UPDATE public.productions SET state='ready' WHERE id=target_production_id;
  ELSE
    UPDATE public.production_stages SET status='ready' WHERE id=stage_id;
    UPDATE public.production_tasks SET status='ready' WHERE stage_id=stage_id;
    UPDATE public.productions SET state='active' WHERE id=target_production_id;
  END IF;

  RETURN created_approval;
END;
$$;
