-- -----------------------------------------------------------------------------
-- Nazuna Graph Performance Optimization Indices
-- -----------------------------------------------------------------------------

-- 1. Index foreign keys in the public.items table to speed up joins and filters
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status_id ON public.items(status_id);

-- 2. Index category association in public.profiles_data table
CREATE INDEX IF NOT EXISTS idx_profiles_data_category_id ON public.profiles_data(category_id);

-- 3. Composite index on security_logs for fast lockout checks in middleware
-- The query looks up: WHERE ip_address = $1 AND resolved_at IS NULL AND created_at >= $2
CREATE INDEX IF NOT EXISTS idx_security_logs_lockout_check ON public.security_logs(ip_address, resolved_at) INCLUDE (created_at);
