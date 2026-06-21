-- Remove the old wide-open select policy
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;

-- Create a new select policy that allows reading all keys except 'api_key' for normal users,
-- and allows admins to read everything.
CREATE POLICY "Enable read access for all users except API keys" ON system_settings
    FOR SELECT USING (
        key <> 'api_key' 
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create database function to verify the API key securely on the database side
CREATE OR REPLACE FUNCTION public.verify_api_key(provided_key text)
RETURNS boolean
SECURITY DEFINER
AS $$
DECLARE
    actual_key text;
BEGIN
    SELECT value::jsonb #>> '{}' INTO actual_key 
    FROM public.system_settings 
    WHERE key = 'api_key';
    
    RETURN actual_key IS NOT NULL AND provided_key = actual_key;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO anon, authenticated;

