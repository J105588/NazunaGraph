-- Add description and image_url to profiles for Exhibition Details
alter table public.profiles
add column description text,
add column image_url text;
