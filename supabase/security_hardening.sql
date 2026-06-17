-- Nazuna Graph Security Hardening Migration
-- Run this script in your Supabase SQL Editor.

-- ==========================================
-- 1. CLEAN UP EXISTING TRIGGERS & CONSTRAINTS
-- ==========================================
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ==========================================
-- 2. RENAME TABLE 'profiles' TO 'profiles_data'
-- ==========================================
ALTER TABLE IF EXISTS public.profiles RENAME TO profiles_data;

-- ==========================================
-- 3. UPDATE USER CREATION TRIGGER FUNCTION
-- ==========================================
-- Point target table to profiles_data directly to bypass view trigger overhead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles_data (id, email, role, group_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'group'), 
    new.raw_user_meta_data->>'group_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the user creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. UPDATE ROLE & CATEGORY ESCALATION TRIGGER
-- ==========================================
-- Prevent non-admins (non-service-role) from changing role and category_id
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
        -- Allow service_role to make updates (bypasses restriction)
        IF auth.role() = 'service_role' THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'You are not allowed to change your role or category.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to profiles_data table (underlying table)
CREATE TRIGGER on_profile_role_change
    BEFORE UPDATE ON public.profiles_data
    FOR EACH ROW
    EXECUTE PROCEDURE public.prevent_role_change();

-- ==========================================
-- 5. CREATE SECURE VIEW 'profiles'
-- ==========================================
-- View must run with security_invoker = true so that table RLS is enforced
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT 
  id,
  group_name,
  display_name,
  description,
  image_url,
  category_id,
  created_at,
  -- Hide email from anyone except owner and admins
  CASE 
    WHEN auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.profiles_data 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN email 
    ELSE NULL 
  END AS email,
  -- Hide role from anyone except owner and admins (default to 'group' for public/other view)
  CASE 
    WHEN auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.profiles_data 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN role 
    ELSE 'group'::text
  END AS role,
  -- Hide force_logout_at from anyone except owner and admins
  CASE 
    WHEN auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.profiles_data 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN force_logout_at 
    ELSE NULL 
  END AS force_logout_at
FROM public.profiles_data;

-- ==========================================
-- 6. CREATE INSTEAD OF TRIGGERS ON VIEW
-- ==========================================
-- This makes the view fully writable as if it was the original table,
-- ensuring zero changes are needed to the client application query code.

-- INSERT Trigger
CREATE OR REPLACE FUNCTION public.trg_profiles_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles_data (id, email, role, group_name, display_name, description, image_url, category_id, force_logout_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.role, 'group'),
    NEW.group_name,
    NEW.display_name,
    NEW.description,
    NEW.image_url,
    NEW.category_id,
    NEW.force_logout_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_insert_trigger
INSTEAD OF INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_insert();

-- UPDATE Trigger
CREATE OR REPLACE FUNCTION public.trg_profiles_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles_data
  SET
    group_name = COALESCE(NEW.group_name, group_name),
    display_name = COALESCE(NEW.display_name, display_name),
    description = COALESCE(NEW.description, description),
    image_url = COALESCE(NEW.image_url, image_url),
    category_id = NEW.category_id,
    email = COALESCE(NEW.email, email),
    role = COALESCE(NEW.role, role),
    force_logout_at = NEW.force_logout_at
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_update_trigger
INSTEAD OF UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_update();

-- DELETE Trigger
CREATE OR REPLACE FUNCTION public.trg_profiles_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.profiles_data WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_delete_trigger
INSTEAD OF DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_delete();

-- ==========================================
-- 7. RE-GRANT VIEW SELECT PRIVILEGES
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;

-- ==========================================
-- 8. HARDEN STORAGE ACCESS POLICIES
-- ==========================================
-- Restrict authenticated uploads to paths starting with their own user ID
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-images' 
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      (storage.foldername(name))[1] = 'profile-' || auth.uid()::text
    )
  );
