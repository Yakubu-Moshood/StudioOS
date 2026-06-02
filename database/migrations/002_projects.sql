-- Migration: 002_projects
-- Creates the projects table owned by a Supabase auth user.
-- owner_id is indexed because every dashboard query filters by it.

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  format     text not null check (format in (
               'Film', 'Series', 'Commercial', 'Documentary', 'YouTube', 'Other'
             )),
  status     text not null default 'active'
               check (status in ('active', 'archived')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists projects_owner_id_idx
  on public.projects (owner_id);

-- Row Level Security
alter table public.projects enable row level security;

drop policy if exists "Users can view own projects"   on public.projects;
drop policy if exists "Users can create own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = owner_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = owner_id);
