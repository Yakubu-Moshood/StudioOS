CREATE OR REPLACE FUNCTION public.decide_creative_stage_version(
  target_artifact_version_id uuid,
  target_stage_key text,
  approval_decision text,
  decision_comment text DEFAULT NULL
)
RETURNS public.approvals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  created_approval public.approvals;
  target_production_id uuid;
  target_artifact_id uuid;
  target_version integer;
  latest_version integer;
  current_stage_id uuid;
  next_stage_id uuid;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF approval_decision NOT IN ('approved','revision_requested') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id;

  IF target_production_id IS NULL THEN RAISE EXCEPTION 'Artifact version not found'; END IF;

  SELECT max(av.version_number)
  INTO latest_version
  FROM public.artifact_versions av
  WHERE av.artifact_id = target_artifact_id;

  IF target_version <> latest_version THEN RAISE EXCEPTION 'Only latest version may be decided'; END IF;

  SELECT ps.id
  INTO current_stage_id
  FROM public.production_stages ps
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = target_stage_key;

  IF current_stage_id IS NULL THEN RAISE EXCEPTION 'Creative stage not found'; END IF;

  SELECT ps2.id
  INTO next_stage_id
  FROM public.production_stages ps1
  JOIN public.production_stages ps2
    ON ps2.production_id = ps1.production_id
   AND ps2.position = ps1.position + 1
  WHERE ps1.id = current_stage_id;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (target_artifact_version_id, approval_decision, NULLIF(trim(decision_comment), ''), current_user_id)
  RETURNING * INTO created_approval;

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status = 'completed' WHERE id = current_stage_id;
    UPDATE public.production_tasks SET status = 'completed' WHERE stage_id = current_stage_id;
    IF next_stage_id IS NOT NULL THEN
      UPDATE public.production_stages SET status = 'ready' WHERE id = next_stage_id;
      UPDATE public.production_tasks SET status = 'ready' WHERE stage_id = next_stage_id;
    END IF;
    UPDATE public.productions SET state = 'ready' WHERE id = target_production_id;
  ELSE
    UPDATE public.production_stages SET status = 'ready' WHERE id = current_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE stage_id = current_stage_id;
    UPDATE public.productions SET state = 'active' WHERE id = target_production_id;
  END IF;

  RETURN created_approval;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_creative_stage_version(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_creative_stage_version(uuid,text,text,text) TO authenticated;
