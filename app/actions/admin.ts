'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function resetUserPassword(userId: string, newPassword: string) {
    // 1. Verify Requesting User is Admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Access denied: Admins only')
    }

    // 2. Perform Password Reset using Admin Client (Service Role)
    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { data, error } = await adminClient.auth.admin.updateUserById(
        userId,
        { password: newPassword }
    )

    if (error) {
        throw new Error(error.message)
    }

    return { success: true }
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string
    const group_name = formData.get('group_name') as string

    if (!email || !password || !role) {
        throw new Error('Missing required fields')
    }

    // 1. Verify Admin (Security Check)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Access denied: Admins only')
    }

    // 2. Create User via Admin Client
    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            role,
            group_name: group_name || null // Ensure null if empty string
        }
    })

    if (error) {
        console.error('Create User Error:', error)
        throw new Error(error.message)
    }

    return { success: true, user: newUser }
}
