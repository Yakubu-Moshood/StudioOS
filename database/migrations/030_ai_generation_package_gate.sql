alter table public.artifacts drop constraint if exists artifacts_artifact_type_check;
alter table public.artifacts add constraint artifacts_artifact_type_check check (
  artifact_type = any (array[
    'brief',
    'research',
    'script',
    'production_package',
    'big_creative_idea',
    'concept_development',
    'visual_development',
    'storyboard',
    'shot_design',
    'asset_creation',
    'scene_intelligence',
    'ai_generation_package'
  ])
);
