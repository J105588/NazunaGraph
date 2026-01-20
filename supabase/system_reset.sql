CREATE OR REPLACE FUNCTION reset_system_data()
RETURNS void AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only admins can perform system reset.';
  END IF;

  -- 1. Delete all items
  DELETE FROM items;

  -- 2. Delete non-admin Profiles
  -- Important: This deletes the profile data. The Auth Users might remain but they will have no profile.
  -- To truly delete users, one would need Supabase Admin API. 
  -- Deleting profile usually effectively resets the user in the app context.
  DELETE FROM profiles
  WHERE role != 'admin';

  -- Note: Categories are PRESERVED as requested.
  -- DELETE FROM categories;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
