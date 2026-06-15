-- Migration: Remove Guest Role
-- Run this in your Supabase SQL Editor to clean up Guest role constraints and defaults.

-- 1. Update any existing 'guest' profiles to 'group' role
UPDATE public.profiles
SET role = 'group'
WHERE role = 'guest';

-- 2. Drop the old role check constraint
-- In standard PostgreSQL, inline constraints get auto-generated names.
-- We check and drop 'profiles_role_check' or similar. 
-- To be safe, we can run a block or just try to drop the common constraint names.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 3. Add the updated role check constraint (excluding guest)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'group'));

-- 4. Change default role to 'group'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'group';

-- 5. Update trigger function to default to 'group' instead of 'guest'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, group_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'group'), 
    new.raw_user_meta_data->>'group_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
