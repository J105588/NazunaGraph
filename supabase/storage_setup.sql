-- 5. Storage Buckets Setup
-- Run this in Supabase SQL Editor to enable image uploads

-- 1. Create the bucket 'item-images'
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- 2. Storage Policies

-- Public View Access (Everyone can see images)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'item-images' );

-- Authenticated Upload (Any logged-in user can upload)
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'item-images' and auth.role() = 'authenticated' );

-- Owner Update/Delete (Users can manage their own files)
create policy "Owner Update/Delete"
  on storage.objects for all
  using ( bucket_id = 'item-images' and auth.uid() = owner );
