-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Profiles (User Roles)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text not null check (role in ('admin', 'group', 'guest')) default 'guest',
  group_name text, -- For 'group' role, the display name of the group
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- -----------------------------------------------------------------------------
-- 2. Master Data: Status Definitions
-- -----------------------------------------------------------------------------
create table public.status_definitions (
  id serial primary key,
  label text not null,       -- e.g., '販売中', '残りわずか', '完売'
  color text not null,       -- e.g., 'bg-green-500', 'bg-yellow-500', 'bg-red-500'
  sort_order int not null default 0,
  is_active boolean default true
);

alter table public.status_definitions enable row level security;

create policy "Status definitions are viewable by everyone."
  on public.status_definitions for select
  using ( true );

create policy "Only admins can insert/update/delete status definitions."
  on public.status_definitions for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

-- -----------------------------------------------------------------------------
-- 3. Master Data: Categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id serial primary key,
  name text not null,
  sort_order int not null default 0
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone."
  on public.categories for select
  using ( true );

create policy "Only admins can manage categories."
  on public.categories for all
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

-- -----------------------------------------------------------------------------
-- 4. Items (The core content)
-- -----------------------------------------------------------------------------
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  owner_id uuid references public.profiles(id) not null, -- The group that owns this item
  category_id int references public.categories(id),
  status_id int references public.status_definitions(id),
  image_url text,
  is_admin_locked boolean default false, -- If true, group cannot edit
  updated_at timestamptz default now()
);

alter table public.items enable row level security;

-- Policies for items

-- VIEW: Everyone can view items
create policy "Items are viewable by everyone."
  on public.items for select
  using ( true );

-- UPDATE: 
-- 1. Admins can update anything
-- 2. Groups (owners) can update their own items IF NOT LOCKED
create policy "Admins can update any item."
  on public.items for update
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

create policy "Owners can update own items if not locked."
  on public.items for update
  using ( 
    auth.uid() = owner_id 
    and is_admin_locked = false 
  );

-- INSERT:
-- Admins and Owners can insert
create policy "Admins can insert items."
  on public.items for insert
  with check ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

create policy "Groups can insert their own items."
  on public.items for insert
  with check ( auth.uid() = owner_id );

-- DELETE:
-- Admins only (or maybe owners too? Let's say Admins only for safety for now, or owners)
create policy "Admins can delete items."
  on public.items for delete
  using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

create policy "Owners can delete own items."
  on public.items for delete
  using ( auth.uid() = owner_id and is_admin_locked = false );

-- -----------------------------------------------------------------------------
-- 5. Storage Buckets (Setup instructions / policies)
-- -----------------------------------------------------------------------------
-- Note: Storage policies usually need to be set in the Storage UI or via specific SQL if the extension is active.
-- Here is a placeholder for the logic.
-- insert into storage.buckets (id, name) values ('item-images', 'item-images');
-- Policy: Public read, Authenticated upload (owners only to their folder/prefix?)

-- -----------------------------------------------------------------------------
-- 6. Trigger for New User -> Profile
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, group_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'guest'), new.raw_user_meta_data->>'group_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
