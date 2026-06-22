'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'

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
    const adminClient = getAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(
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
    const adminClient = getAdminClient()

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

export async function adminUpdateUserProfile(
    userId: string,
    updates: {
        role?: 'admin' | 'group'
        category_id?: number | null
        display_name?: string
        group_name?: string
        description?: string | null
        image_url?: string | null
        is_visible?: boolean
    }
) {
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

    // 2. Initialize Admin Client with service role key
    const adminClient = getAdminClient()

    // 3. If role is being updated, update auth user metadata role as well
    if (updates.role) {
        const { error: authError } = await adminClient.auth.admin.updateUserById(
            userId,
            {
                user_metadata: { role: updates.role }
            }
        )
        if (authError) {
            throw new Error(`Auth update failed: ${authError.message}`)
        }
    }

    // 4. Update profile in database (using adminClient/service role to bypass RLS and triggers check)
    const { error: dbError } = await adminClient
        .from('profiles')
        .update({
            ...(updates.role !== undefined && { role: updates.role }),
            ...(updates.category_id !== undefined && { category_id: updates.category_id }),
            ...(updates.display_name !== undefined && { display_name: updates.display_name }),
            ...(updates.group_name !== undefined && { group_name: updates.group_name }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.image_url !== undefined && { image_url: updates.image_url }),
            ...(updates.is_visible !== undefined && { is_visible: updates.is_visible }),
        })
        .eq('id', userId)

    if (dbError) {
        throw new Error(`Database update failed: ${dbError.message}`)
    }

    return { success: true }
}
