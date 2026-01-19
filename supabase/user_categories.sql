-- 1. Add category_id to profiles
alter table public.profiles
add column category_id int references public.categories(id);

-- 2. (Optional) Migrate existing data?
-- Since we are restructuring, we might just start fresh or manual update.
-- We won't delete category_id from items yet to avoid data loss, but we will stop using it.
