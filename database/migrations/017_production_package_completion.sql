-- Phase 1 Production Package gate

CREATE OR REPLACE FUNCTION public.assemble_production_package(target_production_id uuid)
RETURNS public.artifact_versions
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  approved_brief_version_id uuid;
  approved_research_version_id uuid;
  approved_script_version_id uuid;
  package_stage_id uuid;
  package_task_id uuid;
  package_artifact public.artifacts;
  created_version public.artifact_versions;
  next_version integer;
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

  SELECT av.id INTO approved_script_version_id
  FROM public.artifacts a
  JOIN public.artifact_versions av ON av.artifact_id = a.id
  JOIN public.approvals ap ON ap.artifact_version_id = av.id
  WHERE a.production_id = target_production_id AND a.artifact_type = 'script' AND ap.decision = 'approved'
  ORDER BY av.version_number DESC LIMIT 1;

  IF approved_brief_version_id IS NULL
    OR approved_research_version_id IS NULL
    OR approved_script_version_id IS NULL THEN
    RAISE EXCEPTION 'Approved Brief, Research and Script versions are required';
  END IF;

  SELECT ps.id, pt.id INTO package_stage_id, package_task_id
  FROM public.production_stages ps
  JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = 'production_package'
    AND pt.task_key = 'assemble_production_package';

  IF package_task_id IS NULL THEN RAISE EXCEPTION 'Production Package task not found'; END IF;

  INSERT INTO public.artifacts (production_id, artifact_type, title)
  VALUES (target_production_id, 'production_package', 'Production Package')
  ON CONFLICT (production_id, artifact_type) DO UPDATE SET title = EXCLUDED.title
  RETURNING * INTO package_artifact;

  PERFORM 1 FROM public.artifacts WHERE id = package_artifact.id FOR UPDATE;
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.artifact_versions WHERE artifact_id = package_artifact.id;

  INSERT INTO public.artifact_versions (artifact_id, version_number, content, created_by)
  VALUES (
    package_artifact.id,
    next_version,
    jsonb_build_object(
      'brief_version_id', approved_brief_version_id,
      'research_version_id', approved_research_version_id,
      'script_version_id', approved_script_version_id,
      'assembled_at', now()
    ),
    auth.uid()
  ) RETURNING * INTO created_version;

  UPDATE public.production_stages SET status = 'awaiting_approval' WHERE id = package_stage_id;
  UPDATE public.production_tasks SET status = 'awaiting_approval' WHERE id = package_task_id;
  UPDATE public.productions SET state = 'awaiting_approval'
  WHERE id = target_production_id AND state NOT IN ('completed', 'cancelled');

  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES (
    target_production_id,
    'production_package.assembled',
    auth.uid(),
    'artifact_version',
    created_version.id,
    created_version.content
  );

  RETURN created_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_production_package_version(
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
  package_stage_id uuid;
  package_task_id uuid;
BEGIN
  IF approval_decision NOT IN ('approved', 'revision_requested') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT a.production_id, a.id, av.version_number
  INTO target_production_id, target_artifact_id, target_version
  FROM public.artifact_versions av
  JOIN public.artifacts a ON a.id = av.artifact_id
  WHERE av.id = target_artifact_version_id AND a.artifact_type = 'production_package';

  IF target_production_id IS NULL THEN RAISE EXCEPTION 'Production Package version not found'; END IF;

  SELECT MAX(version_number) INTO latest_version
  FROM public.artifact_versions WHERE artifact_id = target_artifact_id;
  IF target_version <> latest_version THEN RAISE EXCEPTION 'Only latest Production Package version may be decided'; END IF;

  INSERT INTO public.approvals (artifact_version_id, decision, comment, decided_by)
  VALUES (target_artifact_version_id, approval_decision, NULLIF(trim(decision_comment), ''), auth.uid())
  RETURNING * INTO created_approval;

  SELECT ps.id, pt.id INTO package_stage_id, package_task_id
  FROM public.production_stages ps
  JOIN public.production_tasks pt ON pt.stage_id = ps.id
  WHERE ps.production_id = target_production_id
    AND ps.stage_key = 'production_package'
    AND pt.task_key = 'assemble_production_package';

  IF approval_decision = 'approved' THEN
    UPDATE public.production_stages SET status = 'completed' WHERE id = package_stage_id;
    UPDATE public.production_tasks SET status = 'completed' WHERE id = package_task_id;
    UPDATE public.productions
    SET state = 'completed', completed_at = now()
    WHERE id = target_production_id AND state <> 'cancelled';
  ELSE
    UPDATE public.production_stages SET status = 'ready' WHERE id = package_stage_id;
    UPDATE public.production_tasks SET status = 'ready' WHERE id = package_task_id;
    UPDATE public.productions SET state = 'active'
    WHERE id = target_production_id AND state NOT IN ('completed', 'cancelled');
  END IF;

  INSERT INTO public.production_events (production_id, event_type, actor_id, entity_type, entity_id, payload)
  VALUES (
    target_production_id,
    CASE WHEN approval_decision = 'approved'
      THEN 'production.completed'
      ELSE 'production_package.revision_requested'
    END,
    auth.uid(),
    'artifact_version',
    target_artifact_version_id,
    jsonb_build_object('decision', approval_decision)
  );

  RETURN created_approval;
END;
$$;
