-- Storage Foundation v1
-- Creates the MVP production artifact bucket used by manual provider uploads.
-- The bucket is public for MVP smoke testing and non-sensitive demo files only.
-- Before real client use, move to private access with signed downloads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'production-artifacts',
  'production-artifacts',
  true,
  104857600,
  array[
    'video/mp4',
    'video/quicktime',
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

create policy "Authenticated users can read production artifacts"
on storage.objects
for select
to authenticated
using (bucket_id = 'production-artifacts');

create policy "Authenticated users can upload production artifacts"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'production-artifacts');

create policy "Authenticated users can update production artifacts"
on storage.objects
for update
to authenticated
using (bucket_id = 'production-artifacts')
with check (bucket_id = 'production-artifacts');

create policy "Authenticated users can delete production artifacts"
on storage.objects
for delete
to authenticated
using (bucket_id = 'production-artifacts');
