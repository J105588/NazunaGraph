-- Add display_name column to profiles table
-- This represents the "Exhibition Name" (e.g., "Yakisoba Stand"), while group_name represents "Class Name" (e.g., "3-A").

alter table public.profiles
add column column_name text; -- Intentional placeholder to be replaced? No, I should write valid SQL.

alter table public.profiles
add column display_name text;

-- Update RLS policies if necessary (Users can update own profile is already set)
-- "Users can update own profile." on public.profiles for update using ( auth.uid() = id );
-- This policy covers the new column automatically.
