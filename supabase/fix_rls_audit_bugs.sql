-- ==========================================================
-- Migration: Fix RLS Audit Bugs (2026-06-22)
-- Fixes 2 critical bugs found by DB audit:
--   BUG-1: items triggers reference profiles_data.role (column no longer exists)
--   BUG-2: profiles view returns role=null for anon (should be 'group')
-- ==========================================================

-- ==========================================================
-- BUG-1 FIX: Replace profiles_data.role references with is_admin()
-- ==========================================================

-- 1a. Fix enforce_item_lock_and_permissions trigger function
CREATE OR REPLACE FUNCTION public.enforce_item_lock_and_permissions()
RETURNS trigger AS $$
DECLARE
  _is_admin boolean;
BEGIN
  -- Use is_admin() function which correctly references profiles_private
  _is_admin := public.is_admin();

  -- Admin or service role bypasses all checks
  IF _is_admin OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For group owners:
  -- 1. Block ownership transfer
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    RAISE EXCEPTION 'You are not allowed to change the owner of this item.';
  END IF;

  -- 2. Block changing lock status
  IF OLD.is_admin_locked IS DISTINCT FROM NEW.is_admin_locked THEN
    RAISE EXCEPTION 'You are not allowed to change the admin lock status.';
  END IF;

  -- 3. If locked, block changes to anything EXCEPT status_id
  IF OLD.is_admin_locked = true THEN
    IF (OLD.name IS DISTINCT FROM NEW.name) OR
       (OLD.description IS DISTINCT FROM NEW.description) OR
       (OLD.image_url IS DISTINCT FROM NEW.image_url) OR
       (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
      RAISE EXCEPTION 'This item is locked by an administrator. Only status updates are allowed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1b. Fix check_item_registration_permission trigger function
CREATE OR REPLACE FUNCTION public.check_item_registration_permission()
RETURNS trigger AS $$
DECLARE
  _is_admin boolean;
  disabled_users jsonb;
BEGIN
  -- Use is_admin() function which correctly references profiles_private
  _is_admin := public.is_admin();

  IF _is_admin OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Fetch disabled users list
  SELECT value INTO disabled_users
  FROM public.system_settings
  WHERE key = 'disabled_registration_users';

  -- Check if owner_id is in the disabled list
  IF disabled_users IS NOT NULL AND disabled_users ? NEW.owner_id::text THEN
    RAISE EXCEPTION 'Your item registration permission has been restricted by an administrator.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- BUG-2 FIX: profiles view role fallback for anon users
-- ==========================================================

-- Drop and recreate the view with COALESCE fallback
-- Must also drop INSTEAD OF triggers first, then recreate them
DROP TRIGGER IF EXISTS trg_profiles_insert_trigger ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_update_trigger ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_delete_trigger ON public.profiles;

CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.group_name,
  p.display_name,
  p.description,
  p.image_url,
  p.category_id,
  p.created_at,
  p.is_visible,
  s.email,
  COALESCE(s.role, 'group') AS role,
  s.force_logout_at
FROM public.profiles_data p
LEFT JOIN public.profiles_private s ON p.id = s.id;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;

-- Recreate INSTEAD OF triggers on the view

CREATE TRIGGER trg_profiles_insert_trigger
INSTEAD OF INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_insert();

CREATE TRIGGER trg_profiles_update_trigger
INSTEAD OF UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_update();

CREATE TRIGGER trg_profiles_delete_trigger
INSTEAD OF DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_delete();
