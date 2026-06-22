'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

// Helper to verify admin role
async function verifyAdmin() {
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
    return user
}

export async function getApiKey() {
    await verifyAdmin()

    // Query system_settings using service role to bypass RLS restrictions on 'api_key'
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
        .from('system_settings')
        .select('value')
        .eq('key', 'api_key')
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            // Row not found
            return null
        }
        console.error('Failed to get API key:', error)
        throw new Error('Failed to retrieve API key')
    }

    return data?.value as string | null
}

export async function generateApiKey() {
    await verifyAdmin()

    // Generate secure random key: nz_ + 48 hex characters (24 bytes)
    const newKey = `nz_` + crypto.randomBytes(24).toString('hex')

    const adminClient = getAdminClient()

    const { error } = await adminClient
        .from('system_settings')
        .upsert({
            key: 'api_key',
            value: newKey,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Failed to save API key:', error)
        throw new Error('Failed to generate API key')
    }

    return newKey
}
