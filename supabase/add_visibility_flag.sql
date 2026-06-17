-- 1. Add is_visible column to profiles_data table
ALTER TABLE public.profiles_data ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;

-- 2. Drop the existing profiles view to avoid column rename/order errors in CREATE OR REPLACE VIEW
DROP VIEW IF EXISTS public.profiles CASCADE;

-- 3. Create public.profiles view exposing is_visible
CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT 
  id,
  group_name,
  display_name,
  description,
  image_url,
  category_id,
  created_at,
  is_visible,
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

-- 4. Re-grant privileges on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;

-- 5. Recreate INSERT trigger on view
CREATE OR REPLACE FUNCTION public.trg_profiles_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles_data (id, email, role, group_name, display_name, description, image_url, category_id, force_logout_at, is_visible)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.role, 'group'),
    NEW.group_name,
    NEW.display_name,
    NEW.description,
    NEW.image_url,
    NEW.category_id,
    NEW.force_logout_at,
    COALESCE(NEW.is_visible, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_insert_trigger
INSTEAD OF INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_insert();

-- 6. Recreate UPDATE trigger on view
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
    force_logout_at = NEW.force_logout_at,
    is_visible = COALESCE(NEW.is_visible, is_visible)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_update_trigger
INSTEAD OF UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_update();

-- 7. Recreate DELETE trigger on view
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
