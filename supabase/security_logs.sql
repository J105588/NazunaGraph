-- -----------------------------------------------------------------------------
-- Security Logs
-- -----------------------------------------------------------------------------
create table if not exists public.security_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id),
    ip_address text,
    user_agent text,
    reason text,
    created_at timestamptz default now()
);

alter table public.security_logs enable row level security;

-- Only admins can view logs
create policy "Admins can view security logs"
    on public.security_logs for select
    using ( exists ( select 1 from public.profiles where id = auth.uid() and role = 'admin' ) );

-- Authenticated users (or public?) can insert logs (e.g. self-reporting a lockout)
-- Since the action runs on server, the server role usually bypasses RLS, but for good measure:
create policy "Server can insert logs"
    on public.security_logs for insert
    with check ( true ); 
