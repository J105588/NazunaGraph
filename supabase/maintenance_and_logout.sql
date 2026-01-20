-- Add force_logout_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_logout_at TIMESTAMP WITH TIME ZONE;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy for system_settings
-- Everyone can read
CREATE POLICY "Enable read access for all users" ON system_settings
    FOR SELECT USING (true);

-- Only Admin can update
CREATE POLICY "Enable update for admins only" ON system_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert initial maintenance mode (OFF)
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions if needed (usually handled by RLS/Service Role)
grant select on system_settings to anon, authenticated;
grant all on system_settings to service_role;
