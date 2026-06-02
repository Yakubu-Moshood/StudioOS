-- Migration: 005_compass_sections
-- Creates the compass_sections table for project creative direction.
-- Each section belongs to a project; ownership validated through projects via EXISTS.
-- sort_order determines display sequence. UNIQUE(project_id, sort_order) enforced at DB level.
-- Maximum 50 sections per project is enforced in the application layer (addSection Server Action).

create table if not exists public.compass_sections (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  title        text not null,
  content      text not null default '',
  section_type text not null default 'custom'
               check (section_type in (
                 'custom',
                 'visual_language',
                 'tone_atmosphere',
                 'influences',
                 'what_this_is_not'
               )),
  sort_order   integer not null default 0,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- Index for project-scoped queries
create index if not exists compass_sections_project_id_idx
  on public.compass_sections (project_id);

-- Unique composite index — enforces no duplicate sort_order within a project
-- Also serves as the covering index for ORDER BY sort_order queries
create unique index if not exists compass_sections_project_id_sort_order_idx
  on public.compass_sections (project_id, sort_order);

-- Row Level Security
alter table public.compass_sections enable row level security;

drop policy if exists "Users can manage own compass sections" on public.compass_sections;

create policy "Users can manage own compass sections"
  on public.compass_sections for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = compass_sections.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = compass_sections.project_id
        and projects.owner_id = auth.uid()
    )
  );
