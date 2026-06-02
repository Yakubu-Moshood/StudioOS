# Assets Storage Bucket

## Setup (Manual — Supabase Dashboard)

1. Navigate to **Storage** in the Supabase dashboard
2. Click **New bucket**
3. Set **Name**: `assets`
4. Set **Public bucket**: off (private)
5. Click **Save**

## Storage RLS Policies

Run the following SQL in the Supabase SQL editor after creating the bucket.

```sql
-- Allow authenticated users to upload to their own folder
create policy "Users can upload own assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read from their own folder
create policy "Users can read own assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete from their own folder
create policy "Users can delete own assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Storage Path Convention

```
{owner_id}/{project_id}/{asset_id}/{filename}
```

- `owner_id` — `auth.uid()` of the uploading user (UUID string)
- `project_id` — UUID of the project the asset belongs to
- `asset_id` — UUID generated client-side via `crypto.randomUUID()` before upload
- `filename` — original filename from the user's file system

Example: `550e8400-e29b-41d4-a716-446655440000/proj-uuid/asset-uuid/hero-shot.jpg`

## Signed URLs

Signed URLs are generated server-side with a 1-hour expiry.
Never expose the storage service key to the browser.
The `getAssets` Server Action handles signed URL generation for `source_type = 'uploaded'` assets.
