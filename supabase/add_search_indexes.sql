-- -----------------------------------------------------------------------------
-- Nazuna Graph Search and Sort Performance Optimization Indices
-- -----------------------------------------------------------------------------

-- 1. Index item name for fast text matching and sorting
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);

-- 2. Index item updated_at for sorting by last updated time (Admin dashboard etc.)
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON public.items(updated_at DESC);

-- 3. Composite index for fetching items belonging to a specific owner, sorted by name (Group page and APIs)
CREATE INDEX IF NOT EXISTS idx_items_owner_id_name ON public.items(owner_id, name);

-- 4. Composite index for filtering items by status, sorted by name (APIs)
CREATE INDEX IF NOT EXISTS idx_items_status_id_name ON public.items(status_id, name);

-- 5. Index group_name on profiles_data for sorting groups alphabetically (Public page)
CREATE INDEX IF NOT EXISTS idx_profiles_data_group_name ON public.profiles_data(group_name);

-- 6. Index role on profiles_private for filtering groups by their user role (Public page)
CREATE INDEX IF NOT EXISTS idx_profiles_private_role ON public.profiles_private(role);
