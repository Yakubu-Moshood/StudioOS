-- Phase 1 Script gate

CREATE OR REPLACE FUNCTION public.start_script_run(target_production_id uuid)
RETURNS public.runs
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  approved_brief_version_id uuid;
  approved_research_version_id uuid;
  script_stage_id uuid;
  script_task_id uuid;
  created_job public.jobs;
  created_run public.runs;
  next_attempt integer;
BEGIN
  SELECT av.id INTO approved_brief_version_id
  FROM public.artifacts a
  JOIN public.artifact_versions av ON av.artifact_id = a.id
  JOIN public.approvals ap ON ap.artifact_version_id = av.id
  WHERE a.production_id = target_production_id AND a.artifact_type = 'brief' AND ap.decision = 'approved'
  ORDER BY av.version_number DESC LIMIT 1;

  SELECT av.id INTO approved_research_version_id
  FROM public.artifacts a
  JOIN public.artifact_versions av ON av.artifact_id = a.id
  JOIN public.approvals ap ON ap.artifact_version_id = av.id
  WHERE a.production_id = target_production_id AND a.artifact_type = 'research' AND ap.decision = 'approved'
  ORDER BY av.version_number DESC LIMIT 1;

  IF approved_brief_version_id IS NULL OR approved_research_version_id IS NULL THEN
    RAISE EXCEPTION 'Approved Brief and Research versions are required';
  END IF;

  SELECT ps.id, pt.id INTO script_stage_id, script_task_id
  FROM public.production_stages ps
  JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = 'script'
    AND pt.task_key = 'generate_script';

  IF script_task_id IS NULL THEN RAISE EXCEPTION 'Script task not found'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.task_id = script_task_id AND j.status IN ('queued', 'running')
  ) THEN
    RAISE EXCEPTION 'Script is already running';
  END IF;

  INSERT INTO public.jobs (task_id, job_type, status, created_by)
  VALUES (script_task_id, 'generate_script', 'running', auth.uid())
  RETURNING * INTO created_job;

  SELECT COALESCE(MAX(r.attempt), 0) + 1 INTO next_attempt
  FROM public.runs r JOIN public.jobs j ON j.id = r.job_id
  WHERE j.task_id = script_task_id;

  INSERT INTO public.runs (job_id, attempt, status, input)
  VALUES (
    created_job.id,
    next_attempt,
    'running',
    jsonb_build_object(
      'brief_version_id', approved_brief_version_id,
      'research_version_id', approved_research_version_id
    )
  ) RETURNING * INTO created_run;

  UPDATE public.production_stages SET status = 'active' WHERE id = script_stage_id;
  UPDATE public.production_tasks SET status = 'active' WHERE id = script_task_id;
  UPDATE public.productions SET state = 'active'
  WHERE id = target_production_id AND state NOT IN ('completed', 'cancelled');

  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES (target_production_id, 'run.started', auth.uid(), 'run', created_run.id,
    jsonb_build_object('job_type', 'generate_script'));

  RETURN created_run;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_script_run(
  target_run_id uuid,
  script_content jsonb,
  provider_name text,
  model_name text,
  token_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.artifact_versions
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  target_job_id uuid;
  target_production_id uuid;
  script_stage_id uuid;
  script_task_id uuid;
  script_artifact public.artifacts;
  created_version public.artifact_versions;
  next_version integer;
BEGIN
  SELECT j.id, ps.production_id, ps.id, pt.id
  INTO target_job_id, target_production_id, script_stage_id, script_task_id
  FROM public.runs r
  JOIN public.jobs j ON j.id = r.job_id
  JOIN public.production_tasks pt ON pt.id = j.task_id
  JOIN public.production_stages ps ON ps.id = pt.stage_id
  WHERE r.id = target_run_id AND r.status = 'running' AND j.job_type = 'generate_script';

  IF target_job_id IS NULL THEN RAISE EXCEPTION 'Active Script run not found'; END IF;

  INSERT INTO public.artifacts (production_id, artifact_type, title)
  VALUES (target_production_id, 'script', 'Script')
  ON CONFLICT (production_id, artifact_type) DO UPDATE SET title = EXCLUDED.title
  RETURNING * INTO script_artifact;

  PERFORM 1 FROM public.artifacts WHERE id = script_artifact.id FOR UPDATE;
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.artifact_versions WHERE artifact_id = script_artifact.id;

  INSERT INTO public.artifact_versions (artifact_id, version_number, content, created_by, source_run_id)
  VALUES (script_artifact.id, next_version, script_content, auth.uid(), target_run_id)
  RETURNING * INTO created_version;

  UPDATE public.runs SET
    status = 'succeeded', provider = provider_name, model = model_name,
    output = jsonb_build_object('artifact_version_id', created_version.id, 'usage', token_metadata),
    finished_at = now()
  WHERE id = target_run_id;
  UPDATE public.jobs SET status = 'succeeded' WHERE id = target_job_id;
  UPDATE public.production_stages SET status = 'awaiting_approval' WHERE id = script_stage_id;
  UPDATE public.production_tasks SET status = 'awaiting_approval' WHERE id = script_task_id;
  UPDATE public.productions SET state = 'awaiting_approval' WHERE id = target_production_id;

  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES
    (target_production_id, 'run.succeeded', auth.uid(), 'run', target_run_id, '{}'::jsonb),
    (target_production_id, 'artifact.version_created', auth.uid(), 'artifact_version', created_version.id,
      jsonb_build_object('artifact_type', 'script', 'version_number', created_version.version_number));

  RETURN created_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_script_run(target_run_id uuid, failure jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  target_job_id uuid; target_production_id uuid; script_stage_id uuid; script_task_id uuid;
BEGIN
  SELECT j.id, ps.production_id, ps.id, pt.id
  INTO target_job_id, target_production_id, script_stage_id, script_task_id
  FROM public.runs r
  JOIN public.jobs j ON j.id = r.job_id
  JOIN public.production_tasks pt ON pt.id = j.task_id
  JOIN public.production_stages ps ON ps.id = pt.stage_id
  WHERE r.id = target_run_id AND r.status = 'running';
  IF target_job_id IS NULL THEN RETURN; END IF;

  UPDATE public.runs SET status = 'failed', error = failure, finished_at = now() WHERE id = target_run_id;
  UPDATE public.jobs SET status = 'failed' WHERE id = target_job_id;
  UPDATE public.production_stages SET status = 'ready' WHERE id = script_stage_id;
  UPDATE public.production_tasks SET status = 'failed' WHERE id = script_task_id;
  UPDATE public.productions SET state = 'blocked' WHERE id = target_production_id;
  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES (target_production_id, 'run.failed', auth.uid(), 'run', target_run_id, failure);
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_script_version(
  target_artifact_version_id uuid,
  approval_decision text,
  decision_comment text DEFAULT NULL
)
RETURNS public.approvals
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  created_approval public.approvals;
  target_production_id uuid;
  target_artifact_id uuid;
  target_version integer;
  latest_version integer;
  script_stage_id uuid;
  package_stage_id uuid;
  script_task_id uuid;
  package_task_id uuid;
BEGIN
  IF approval_decision NOT IN ('approved', 'revision_requested') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id AND a.artifact_type = 'script';

  IF target_production_id IS NULL THEN RAISE EXCEPTION 'Script version not found'; END IF;

  SELECT MAX(version_number) INTO latest_version
  FROM public.artifact_versions WHERE artifact_id = target_artifact_id;
  IF target_version <> latest_version THEN RAISE EXCEPTION 'Only latest Script version may be decided'; END IF;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (target_artifact_version_id, approval_decision, NULLIF(trim(decision_comment), ''), auth.uid())
  RETURNING * INTO created_approval;

  SELECT ps.id, pt.id INTO script_stage_id, script_task_id
  FROM public.production_stages ps JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id AND ps.stage_key = 'script' AND pt.task_key = 'generate_script';

  SELECT ps.id, pt.id INTO package_stage_id, package_task_id
  FROM public.production_stages ps JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id AND ps.stage_key = 'production_package'
    AND pt.task_key = 'assemble_production_package';

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status = 'completed' WHERE id = script_stage_id;
    UPDATE public.production_tasks SET status = 'completed' WHERE id = script_task_id;
    UPDATE public.production_stages SET status = 'ready' WHERE id = package_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = package_task_id;
    UPDATE public.productions SET state = 'ready' WHERE id = target_production_id;
  ELSE
    UPDATE public.production_stages SET status = 'ready' WHERE id = script_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = script_task_id;
    UPDATE public.production_stages SET status = 'pending' WHERE id = package_stage_id;
    UPDATE public.production_tasks SET status = 'pending' WHERE id = package_task_id;
    UPDATE public.productions SET state = 'active' WHERE id = target_production_id;
  END IF;

  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES (target_production_id,
    CASE WHEN approval_decision = 'approved' THEN 'artifact_version.approved' ELSE 'artifact_version.revision_requested' END,
    auth.uid(), 'artifact_version', target_artifact_version_id,
    jsonb_build_object('artifact_type', 'script', 'decision', approval_decision));

  RETURN created_approval;
END;
$$;
