-- Secure Profile Updates
-- Prevent users from changing their own role (Privilege Escalation Protection)

create or replace function public.prevent_role_change()
returns trigger as $$
begin
    -- If the role is being changed
    if OLD.role is distinct from NEW.role then
        -- Allow if it's the service role (superuser) or potentially an admin (though admin editing own role is weird)
        -- Ideally, ONLY service_role should be changing roles via Admin API.
        -- But RLS "Users can update own profile" allows them to send update requests.
        
        -- Check if the current user is trying to change the role
        -- We can just Block it strictly: "Role cannot be changed via standard update"
        -- Admin updates should be done via service role client (bypasses RLS/Triggers? No, triggers run)
        -- Wait, Supabase Service Role DOES bypass RLS but Triggers still run.
        -- We need a way to detect if it's an admin action.
        
        -- However, simpler: Role is immutable for the user themselves.
        -- If an admin changes it via the User Management UI, that UI calls `updateUserById` or direct DB update.
        -- If we use Service Role for admin updates, we can check `auth.role()`.
        
        if auth.role() = 'service_role' then
            return NEW;
        end if;

        -- If logic arrives here, it's a normal user (authenticated) or anonymous trying to hack.
        raise exception 'You are not allowed to change your role.';
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow idempotent runs
drop trigger if exists on_profile_role_change on public.profiles;

create trigger on_profile_role_change
    before update on public.profiles
    for each row
    execute procedure public.prevent_role_change();
