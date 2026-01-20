-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Enable update for admins only" ON system_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;

-- Re-create Read Policy
CREATE POLICY "Enable read access for all users" ON system_settings
    FOR SELECT USING (true);

-- Create comprehensive Admin Policy (Insert, Update, Delete)
CREATE POLICY "Enable full access for admins" ON system_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
