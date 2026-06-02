-- Migration: 003_project_core
-- Creates the project_core table for project creative foundation data.
-- One row per project. Ownership validated through projects via EXISTS subquery.

create table if not exists public.project_core (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  synopsis   text,
  genre      text check (genre in (
               'drama', 'comedy', 'thriller', 'horror',
               'action', 'romance', 'documentary', 'other'
             )),
  tone       text check (tone in (
               'dark', 'light', 'satirical', 'dramatic',
               'comedic', 'neutral', 'other'
             )),
  themes     text[] not null default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- One core record per project
create unique index if not exists project_core_project_id_idx
  on public.project_core (project_id);

-- Row Level Security
alter table public.project_core enable row level security;

drop policy if exists "Users can manage own project core" on public.project_core;

create policy "Users can manage own project core"
  on public.project_core for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_core.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_core.project_id
        and projects.owner_id = auth.uid()
    )
  );
