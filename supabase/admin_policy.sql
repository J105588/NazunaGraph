-- Allow admins to update any profile
create policy "Admins can update any profile"
on public.profiles
for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow admins to delete any profile (if needed, though usually cascade from auth.users)
-- But we can't easily delete auth.users from client without Service Role.
-- So we will strictly stick to editing profiles for now.
-- If user wants to "delete" user, it usually means banning or removing from Auth.
-- For now, just editing Role/Names.
