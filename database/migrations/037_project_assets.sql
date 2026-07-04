-- Project Assets v1
-- Creates a simple project-level asset library for reusable files.
-- The bucket is public for MVP smoke testing and non-sensitive demo files only.
-- Before real client use, move to private access with signed downloads.

create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  storage_path text not null,
  content_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.project_assets enable row level security;

drop policy if exists "Users can read their project assets" on public.project_assets;
drop policy if exists "Users can insert their project assets" on public.project_assets;
drop policy if exists "Users can delete their project assets" on public.project_assets;

create policy "Users can read their project assets"
on public.project_assets
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their project assets"
on public.project_assets
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can delete their project assets"
on public.project_assets
for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists project_assets_project_id_created_at_idx
on public.project_assets (project_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-assets',
  'project-assets',
  true,
  104857600,
  array[
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can read project assets" on storage.objects;
drop policy if exists "Authenticated users can upload project assets" on storage.objects;
drop policy if exists "Authenticated users can update project assets" on storage.objects;
drop policy if exists "Authenticated users can delete project assets" on storage.objects;

create policy "Authenticated users can read project assets"
on storage.objects
for select
to authenticated
using (bucket_id = 'project-assets');

create policy "Authenticated users can upload project assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-assets');

create policy "Authenticated users can update project assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'project-assets')
with check (bucket_id = 'project-assets');

create policy "Authenticated users can delete project assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'project-assets');
