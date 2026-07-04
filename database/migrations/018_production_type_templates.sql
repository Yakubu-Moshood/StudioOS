-- Production type template foundation
-- Stores the selected production type while retaining the Phase 1 four-stage workflow.

ALTER TABLE public.productions
  ADD COLUMN IF NOT EXISTS production_type text NOT NULL DEFAULT 'custom' CHECK (
    production_type IN ('advertising_campaign', 'documentary', 'explainer_video', 'custom')
  ),
  ADD COLUMN IF NOT EXISTS workflow_template_key text NOT NULL DEFAULT 'custom_v1';

UPDATE public.productions
SET workflow_template_key = CASE production_type
  WHEN 'advertising_campaign' THEN 'advertising_campaign_v1'
  WHEN 'documentary' THEN 'documentary_v1'
  WHEN 'explainer_video' THEN 'explainer_video_v1'
  ELSE 'custom_v1'
END;

DROP FUNCTION IF EXISTS public.create_mvp_production(uuid, text);

CREATE OR REPLACE FUNCTION public.create_mvp_production(
  target_project_id uuid,
  production_title text,
  selected_production_type text DEFAULT 'custom'
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
  selected_template_key text;
BEGIN
  IF char_length(trim(production_title)) = 0 THEN
    RAISE EXCEPTION 'Production title is required';
  END IF;

  IF selected_production_type NOT IN ('advertising_campaign', 'documentary', 'explainer_video', 'custom') THEN
    RAISE EXCEPTION 'Invalid production type';
  END IF;

  selected_template_key := CASE selected_production_type
    WHEN 'advertising_campaign' THEN 'advertising_campaign_v1'
    WHEN 'documentary' THEN 'documentary_v1'
    WHEN 'explainer_video' THEN 'explainer_video_v1'
    ELSE 'custom_v1'
  END;

  INSERT INTO public.productions (
    project_id,
    title,
    production_type,
    workflow_template_key,
    created_by
  )
  VALUES (
    target_project_id,
    trim(production_title),
    selected_production_type,
    selected_template_key,
    auth.uid()
  )
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
    jsonb_build_object(
      'workflow_key', created_production.workflow_key,
      'production_type', created_production.production_type,
      'workflow_template_key', created_production.workflow_template_key
    )
  );

  RETURN created_production;
END;
$$;
