-- 1. Update RLS policies for items update
-- Drop old restrict policy
DROP POLICY IF EXISTS "Owners can update own items if not locked." ON public.items;
DROP POLICY IF EXISTS "Owners can update own items." ON public.items;

-- Create new update policy that permits owners to update, letting the trigger handle the lock enforcement
CREATE POLICY "Owners can update own items."
  ON public.items FOR UPDATE
  USING ( auth.uid() = owner_id );

-- 2. Create trigger function to enforce lock conditions and prevent owner_id / is_admin_locked modifications by non-admins
CREATE OR REPLACE FUNCTION public.enforce_item_lock_and_permissions()
RETURNS trigger AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Determine if the user is an admin
  is_admin := EXISTS (
    SELECT 1 FROM public.profiles_data
    WHERE id = auth.uid() AND role = 'admin'
  );

  -- Admin or service role bypasses all checks
  IF is_admin OR auth.role() = 'service_role' THEN
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

DROP TRIGGER IF EXISTS trg_enforce_item_lock ON public.items;
CREATE TRIGGER trg_enforce_item_lock
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_item_lock_and_permissions();

-- 3. Create trigger function to check item registration permissions (disabled users check)
CREATE OR REPLACE FUNCTION public.check_item_registration_permission()
RETURNS trigger AS $$
DECLARE
  is_admin boolean;
  disabled_users jsonb;
BEGIN
  -- Admins can always insert items
  is_admin := EXISTS (
    SELECT 1 FROM public.profiles_data
    WHERE id = auth.uid() AND role = 'admin'
  );
  IF is_admin OR auth.role() = 'service_role' THEN
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

DROP TRIGGER IF EXISTS trg_check_item_registration ON public.items;
CREATE TRIGGER trg_check_item_registration
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_item_registration_permission();

-- 4. Enable Supabase Realtime for items and status_definitions tables
DO $$
BEGIN
  -- Add items to supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  END IF;

  -- Add status_definitions to supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'status_definitions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.status_definitions;
  END IF;
END $$;

ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.status_definitions REPLICA IDENTITY FULL;
