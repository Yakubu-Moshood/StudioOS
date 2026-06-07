-- Migration: 007_blocks
-- Creates the blocks table for production structure data.
-- Multiple rows per project. Flat ordered list in Sprint 11; parent_id column
-- stored for future hierarchy implementation but not used in Sprint 11 UI.
-- Ownership validated through projects via EXISTS subquery (Pattern B RLS).

create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type       text not null check (type in (
               'scene', 'sequence', 'act', 'beat', 'note', 'other'
             )),
  title      text not null,
  content    text,
  status     text not null default 'draft' check (status in (
               'draft', 'in_progress', 'complete', 'needs_revision'
             )),
  sort_order integer not null default 0,
  parent_id  uuid references public.blocks (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for project-scoped queries (getBlocks, addBlock count)
create index if not exists blocks_project_id_idx
  on public.blocks (project_id);

-- Index for future hierarchy traversal (parent_id lookups)
create index if not exists blocks_parent_id_idx
  on public.blocks (parent_id);

-- Row Level Security
alter table public.blocks enable row level security;

drop policy if exists "Users can manage own project blocks" on public.blocks;

create policy "Users can manage own project blocks"
  on public.blocks for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = blocks.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = blocks.project_id
        and projects.owner_id = auth.uid()
    )
  );
