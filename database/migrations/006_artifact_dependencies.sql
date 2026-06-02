-- Table
create table if not exists public.artifact_dependencies (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null
                  references public.projects (id) on delete cascade,
  source_type     text not null
                  check (source_type in (
                    'compass_section', 'asset', 'project_core', 'project'
                  )),
  source_id       uuid not null,
  target_type     text not null
                  check (target_type in (
                    'compass_section', 'asset', 'project_core', 'project'
                  )),
  target_id       uuid not null,
  dependency_type text not null default 'references'
                  check (dependency_type in (
                    'references', 'informed_by', 'contrasts_with'
                  )),
  created_at      timestamptz not null default now()
);

-- Uniqueness: one edge per (project, source, target, dependency_type) combination.
-- Allows the same two artifacts to have multiple relationships of different types.
create unique index if not exists artifact_dependencies_unique_edge_idx
  on public.artifact_dependencies
  (project_id, source_type, source_id, target_type, target_id, dependency_type);

-- Forward lookup: "what does artifact X depend on?"
create index if not exists artifact_dependencies_source_idx
  on public.artifact_dependencies (project_id, source_type, source_id);

-- Reverse lookup: "what depends on artifact X?"
create index if not exists artifact_dependencies_target_idx
  on public.artifact_dependencies (project_id, target_type, target_id);

-- RLS
alter table public.artifact_dependencies enable row level security;

drop policy if exists "Users can manage own artifact dependencies"
  on public.artifact_dependencies;

create policy "Users can manage own artifact dependencies"
  on public.artifact_dependencies for all
  using (exists (
    select 1 from public.projects
    where projects.id = artifact_dependencies.project_id
      and projects.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects
    where projects.id = artifact_dependencies.project_id
      and projects.owner_id = auth.uid()
  ));

-- Trigger function for polymorphic orphan cleanup.
-- security definer so the function can delete across tables regardless of
-- the calling session's RLS context (required for BEFORE DELETE triggers).
create or replace function public.delete_artifact_dependencies()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from public.artifact_dependencies
  where source_id = old.id or target_id = old.id;
  return old;
end;
$$;

-- Trigger: assets
drop trigger if exists assets_delete_dependencies on public.assets;
create trigger assets_delete_dependencies
  before delete on public.assets
  for each row execute function public.delete_artifact_dependencies();

-- Trigger: compass_sections
drop trigger if exists compass_sections_delete_dependencies
  on public.compass_sections;
create trigger compass_sections_delete_dependencies
  before delete on public.compass_sections
  for each row execute function public.delete_artifact_dependencies();

-- Trigger: project_core
drop trigger if exists project_core_delete_dependencies on public.project_core;
create trigger project_core_delete_dependencies
  before delete on public.project_core
  for each row execute function public.delete_artifact_dependencies();
