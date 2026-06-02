-- Migration: 004_assets
-- Creates the assets table for project asset library.
-- Each asset is owned by a user and belongs to a project.
-- Storage paths follow: {owner_id}/{project_id}/{asset_id}/{filename}

create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  type         text check (type in ('image', 'video', 'audio', 'document', 'reference', 'other')),
  source       text check (source in ('upload', 'external', 'generated')),
  source_type  text not null check (source_type in ('uploaded', 'external')),
  storage_path text,
  external_url text,
  size         bigint,
  mime_type    text,
  description  text,
  notes        text,
  tags         text[] not null default '{}',
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

create index if not exists assets_project_id_idx on public.assets (project_id);
create index if not exists assets_owner_id_idx on public.assets (owner_id);

-- Row Level Security
alter table public.assets enable row level security;

drop policy if exists "Users can manage own assets" on public.assets;

create policy "Users can manage own assets"
  on public.assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
