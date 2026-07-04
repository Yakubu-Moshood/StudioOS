CREATE OR REPLACE FUNCTION public.decide_script_version(
  target_artifact_version_id uuid,
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
  script_stage_id uuid;
  script_task_id uuid;
  next_stage_id uuid;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF approval_decision NOT IN ('approved','revision_requested') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id
    AND a.artifact_type = 'script';

  IF target_production_id IS NULL THEN RAISE EXCEPTION 'Script version not found'; END IF;

  SELECT max(version_number) INTO latest_version
  FROM public.artifact_versions
  WHERE artifact_id = target_artifact_id;

  IF target_version <> latest_version THEN RAISE EXCEPTION 'Only latest Script version may be decided'; END IF;

  SELECT ps.id, pt.id
  INTO script_stage_id, script_task_id
  FROM public.production_stages ps
  JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = 'script'
    AND pt.task_key = 'generate_script';

  SELECT ps2.id
  INTO next_stage_id
  FROM public.production_stages ps1
  JOIN public.production_stages ps2
    ON ps2.production_id = ps1.production_id
   AND ps2.position = ps1.position + 1
  WHERE ps1.id = script_stage_id;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (target_artifact_version_id, approval_decision, NULLIF(trim(decision_comment), ''), current_user_id)
  RETURNING * INTO created_approval;

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status = 'completed' WHERE id = script_stage_id;
    UPDATE public.production_tasks SET status = 'completed' WHERE id = script_task_id;
    IF next_stage_id IS NOT NULL THEN
      UPDATE public.production_stages SET status = 'ready' WHERE id = next_stage_id;
      UPDATE public.production_tasks SET status = 'ready' WHERE stage_id = next_stage_id;
    END IF;
    UPDATE public.productions SET state = 'ready' WHERE id = target_production_id;
  ELSE
    UPDATE public.production_stages SET status = 'ready' WHERE id = script_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = script_task_id;
    UPDATE public.productions SET state = 'active' WHERE id = target_production_id;
  END IF;

  RETURN created_approval;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_script_version(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_script_version(uuid,text,text) TO authenticated;
