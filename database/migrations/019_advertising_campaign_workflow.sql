-- Advertising Campaign workflow template v1

ALTER TABLE public.production_stages
  ADD COLUMN IF NOT EXISTS title text;

UPDATE public.production_stages
SET title = CASE stage_key
  WHEN 'brief' THEN 'Brief'
  WHEN 'research' THEN 'Research'
  WHEN 'script' THEN 'Script'
  WHEN 'production_package' THEN 'Production Package'
  ELSE initcap(replace(stage_key, '_', ' '))
END
WHERE title IS NULL;

ALTER TABLE public.production_stages
  ALTER COLUMN title SET NOT NULL;

ALTER TABLE public.production_stages
  DROP CONSTRAINT IF EXISTS production_stages_stage_key_check;

ALTER TABLE public.production_stages
  DROP CONSTRAINT IF EXISTS production_stages_position_check;

ALTER TABLE public.production_stages
  ADD CONSTRAINT production_stages_position_check CHECK (position BETWEEN 1 AND 50);

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
  stage_id uuid;
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
    project_id, title, production_type, workflow_template_key, created_by
  ) VALUES (
    target_project_id, trim(production_title), selected_production_type, selected_template_key, auth.uid()
  ) RETURNING * INTO created_production;

  IF selected_production_type = 'advertising_campaign' THEN
    INSERT INTO public.production_stages (production_id, stage_key, title, position, status) VALUES
      (created_production.id, 'brief', 'Client Discovery', 1, 'ready'),
      (created_production.id, 'research', 'Strategic Discovery', 2, 'pending'),
      (created_production.id, 'big_creative_idea', 'Big Creative Idea', 3, 'pending'),
      (created_production.id, 'concept_development', 'Concept Development', 4, 'pending'),
      (created_production.id, 'script', 'Script Development', 5, 'pending'),
      (created_production.id, 'visual_development', 'Visual Development', 6, 'pending'),
      (created_production.id, 'storyboard', 'Storyboard', 7, 'pending'),
      (created_production.id, 'shot_design', 'Shot Design', 8, 'pending'),
      (created_production.id, 'asset_creation', 'Asset Creation', 9, 'pending'),
      (created_production.id, 'scene_intelligence', 'Scene Intelligence', 10, 'pending'),
      (created_production.id, 'ai_generation_package', 'AI Generation Package', 11, 'pending'),
      (created_production.id, 'video_generation', 'Video Generation', 12, 'pending'),
      (created_production.id, 'post_production', 'Post-production', 13, 'pending'),
      (created_production.id, 'delivery', 'Delivery', 14, 'pending'),
      (created_production.id, 'production_package', 'Campaign Deployment & Production Package', 15, 'pending');
  ELSE
    INSERT INTO public.production_stages (production_id, stage_key, title, position, status) VALUES
      (created_production.id, 'brief', 'Brief', 1, 'ready'),
      (created_production.id, 'research', 'Research', 2, 'pending'),
      (created_production.id, 'script', 'Script', 3, 'pending'),
      (created_production.id, 'production_package', 'Production Package', 4, 'pending');
  END IF;

  INSERT INTO public.production_tasks (stage_id, task_key, title, status)
  SELECT id,
    CASE stage_key
      WHEN 'brief' THEN 'create_brief'
      WHEN 'research' THEN 'generate_research'
      WHEN 'script' THEN 'generate_script'
      WHEN 'production_package' THEN 'assemble_production_package'
      ELSE 'complete_' || stage_key
    END,
    CASE stage_key
      WHEN 'brief' THEN 'Create production brief'
      WHEN 'research' THEN 'Generate research'
      WHEN 'script' THEN 'Generate script'
      WHEN 'production_package' THEN 'Assemble production package'
      ELSE 'Complete ' || title
    END,
    CASE WHEN position = 1 THEN 'ready' ELSE 'pending' END
  FROM public.production_stages
  WHERE production_id = created_production.id;

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
