-- Enable replication for Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Ensure replica identity is set (usually default is fine, but for strict updates...)
ALTER TABLE system_settings REPLICA IDENTITY FULL;
-- Profiles usually has PK so default is fine, but FULL helps if we need all columns in payload (though we filter by ID).
ALTER TABLE profiles REPLICA IDENTITY FULL;
