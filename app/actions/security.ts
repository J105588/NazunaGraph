'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function logSecurityEvent(userId: string, reason: string) {
    const headerStore = await headers()
    let ip = headerStore.get('x-forwarded-for')

    // Handle multiple IPs in x-forwarded-for (e.g. "client, proxy1, proxy2")
    if (ip) {
        ip = ip.split(',')[0].trim()
    } else {
        // Fallback to x-real-ip or other common headers
        ip = headerStore.get('x-real-ip') || 'unknown'
    }

    const userAgent = headerStore.get('user-agent') || 'unknown'

    // Use Admin Client to bypass RLS if necessary, or just standard server client
    // Since we want to ensure it's written even if user is logged out (technically user IS logged out when this happens),
    // we should use service role.
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

    const { error } = await adminClient
        .from('security_logs')
        .insert({
            user_id: userId,
            ip_address: ip,
            user_agent: userAgent,
            reason: reason
        })

    if (error) {
        console.error('Failed to log security event:', error)
    }
}

export async function verifySecurityKey(key: string) {
    const adminKey = process.env.ADMIN_SECURITY_KEY

    // If no key is set in env, default to block or allow? Safe default: Block.
    if (!adminKey) {
        console.error('ADMIN_SECURITY_KEY is not set')
        return { valid: false, message: 'Server configuration error' }
    }

    if (key === adminKey) {
        return { valid: true }
    } else {
        return { valid: false, message: 'Invalid Security Key' }
    }
}

export async function checkIpLockout() {
    const headerStore = await headers()
    let ip = headerStore.get('x-forwarded-for')

    if (ip) {
        ip = ip.split(',')[0].trim()
    } else {
        ip = headerStore.get('x-real-ip') || 'unknown'
    }

    if (ip === 'unknown') return { locked: false }

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

    // Check for any logs for this IP in the last 24 hours that are NOT resolved
    const { data, error } = await adminClient
        .from('security_logs')
        .select('created_at')
        .eq('ip_address', ip)
        .is('resolved_at', null) // Only active locks
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Failed to check IP lockout:', error)
        return { locked: false }
    }

    if (data && data.length > 0) {
        const lastLog = data[0]
        const lockoutEnd = new Date(lastLog.created_at).getTime() + (24 * 60 * 60 * 1000)
        return { locked: true, remainingMs: lockoutEnd - Date.now(), lockoutEnd }
    }

    return { locked: false }
}

export async function unlockSystem(key: string) {
    const adminKey = process.env.ADMIN_SECURITY_KEY
    if (!adminKey || key !== adminKey) {
        return { success: false, message: 'Invalid Security Key' }
    }

    const headerStore = await headers()
    let ip = headerStore.get('x-forwarded-for')

    if (ip) {
        ip = ip.split(',')[0].trim()
    } else {
        ip = headerStore.get('x-real-ip') || 'unknown'
    }

    if (ip === 'unknown') {
        return { success: false, message: 'Could not identify device IP' }
    }

    const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Delete logs for this specific IP
    // Soft-delete (resolve) logs for this specific IP instead of deleting
    const { error } = await adminClient
        .from('security_logs')
        .update({ resolved_at: new Date().toISOString() })
        .eq('ip_address', ip)
        .is('resolved_at', null)

    if (error) {
        console.error('Failed to unlock IP:', error)
        return { success: false, message: 'Database error during unlock' }
    }

    return { success: true }
}
