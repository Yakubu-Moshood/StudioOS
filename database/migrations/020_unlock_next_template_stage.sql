-- Unlock the next template stage after Strategic Discovery approval.

CREATE OR REPLACE FUNCTION public.decide_research_version(
  target_artifact_version_id uuid,
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
  research_stage_id uuid;
  research_task_id uuid;
  next_stage_id uuid;
BEGIN
  IF approval_decision NOT IN ('approved', 'revision_requested') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id
    AND a.artifact_type = 'research';

  IF target_production_id IS NULL THEN
    RAISE EXCEPTION 'Research version not found';
  END IF;

  SELECT MAX(version_number)
  INTO latest_version
  FROM public.artifact_versions
  WHERE artifact_id = target_artifact_id;

  IF target_version <> latest_version THEN
    RAISE EXCEPTION 'Only latest Research version may be decided';
  END IF;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (
    target_artifact_version_id,
    approval_decision,
    NULLIF(trim(decision_comment), ''),
    auth.uid()
  )
  RETURNING * INTO created_approval;

  SELECT ps.id, pt.id
  INTO research_stage_id, research_task_id
  FROM public.production_stages ps
  JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = 'research'
    AND pt.task_key = 'generate_research';

  SELECT next_stage.id
  INTO next_stage_id
  FROM public.production_stages current_stage
  JOIN public.production_stages next_stage
    ON next_stage.production_id = current_stage.production_id
   AND next_stage.position = current_stage.position + 1
  WHERE current_stage.id = research_stage_id;

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages
    SET status = 'completed'
    WHERE id = research_stage_id;

    UPDATE public.production_tasks
    SET status = 'completed'
    WHERE id = research_task_id;

    UPDATE public.production_stages
    SET status = 'ready'
    WHERE id = next_stage_id;

    UPDATE public.production_tasks
    SET status = 'ready'
    WHERE stage_id = next_stage_id;

    UPDATE public.productions
    SET state = 'ready'
    WHERE id = target_production_id;
  ELSE
    UPDATE public.production_stages
    SET status = 'ready'
    WHERE id = research_stage_id;

    UPDATE public.production_tasks
    SET status = 'ready'
    WHERE id = research_task_id;

    UPDATE public.production_stages
    SET status = 'pending'
    WHERE id = next_stage_id;

    UPDATE public.production_tasks
    SET status = 'pending'
    WHERE stage_id = next_stage_id;

    UPDATE public.productions
    SET state = 'active'
    WHERE id = target_production_id;
  END IF;

  INSERT INTO public.production_events (
    production_id,
    event_type,
    actor_id,
    entity_type,
    entity_id,
    payload
  )
  VALUES (
    target_production_id,
    CASE
      WHEN approval_decision = 'approved' THEN 'artifact_version.approved'
      ELSE 'artifact_version.revision_requested'
    END,
    auth.uid(),
    'artifact_version',
    target_artifact_version_id,
    jsonb_build_object('artifact_type', 'research', 'decision', approval_decision)
  );

  RETURN created_approval;
END;
$$;

-- Backfill existing advertising campaigns whose Strategic Discovery was already approved.
UPDATE public.production_stages next_stage
SET status = 'ready'
FROM public.production_stages research_stage
WHERE next_stage.production_id = research_stage.production_id
  AND next_stage.position = research_stage.position + 1
  AND research_stage.stage_key = 'research'
  AND research_stage.status = 'completed'
  AND next_stage.status = 'pending';

UPDATE public.production_tasks next_task
SET status = 'ready'
FROM public.production_stages next_stage
JOIN public.production_stages research_stage
  ON research_stage.production_id = next_stage.production_id
 AND next_stage.position = research_stage.position + 1
WHERE next_task.stage_id = next_stage.id
  AND research_stage.stage_key = 'research'
  AND research_stage.status = 'completed'
  AND next_task.status = 'pending';
