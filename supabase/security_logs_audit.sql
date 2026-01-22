-- Enhance Security Logs for Audit Retention

-- 1. Add resolved_at column to track when a lockout was cleared without deleting the log
alter table public.security_logs 
add column if not exists resolved_at timestamptz;

-- 2. Ensure RLS allows admins to view these logs (already exists, but good to confirm)
-- Policy "Admins can view security logs" exists.

-- Note: No data migration needed as new column is nullable.
