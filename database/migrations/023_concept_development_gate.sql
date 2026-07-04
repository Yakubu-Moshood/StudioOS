ALTER TABLE public.artifacts DROP CONSTRAINT IF EXISTS artifacts_artifact_type_check;
ALTER TABLE public.artifacts ADD CONSTRAINT artifacts_artifact_type_check CHECK (
  artifact_type IN (
    'brief',
    'research',
    'script',
    'production_package',
    'big_creative_idea',
    'concept_development'
  )
);
