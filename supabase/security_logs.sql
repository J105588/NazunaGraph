-- -----------------------------------------------------------------------------
-- Security Logs
-- -----------------------------------------------------------------------------
-- Existing table creation...

-- Update RLS
alter table public.security_logs enable row level security;

-- DROP permissive policy if exists (re-runnable script)
drop policy if exists "Server can insert logs" on public.security_logs;
drop policy if exists "Admins can view security logs" on public.security_logs;

-- 1. Admins can VIEW logs using standard authentication
create policy "Admins can view security logs"
    on public.security_logs for select
    using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

-- 2. DISALLOW public/authenticated inserts via client.
-- Entries should ONLY be created by the Server Actions (which use Service Role).
-- Therefore, NO insert policy is needed for 'public' or 'authenticated' roles.
-- Service Role bypasses RLS automatically.
