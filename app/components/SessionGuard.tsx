'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'
import { logSecurityEvent } from '@/app/actions/security'

export default function SessionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [supabase] = useState(() => createClient())
    const lastLogoutAt = useRef<string | null>(null)

    useEffect(() => {
        // 1. Check Maintenance Mode
        const checkMaintenance = async () => {
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single()

            if (settings?.value === true) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile?.role !== 'admin') {
                        if (pathname !== '/maintenance') {
                            router.replace('/maintenance')
                        }
                    }
                } else if (pathname !== '/maintenance' && pathname !== '/login') {
                    // Allow login page access so admins can login
                    router.replace('/maintenance')
                }
            } else {
                if (pathname === '/maintenance') {
                    router.replace('/')
                }
            }
        }

        // 2. Realtime Subscriptions
        const settingsChannel = supabase
            .channel('system_settings_guard')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'key=eq.maintenance_mode' },
                (payload) => {
                    if (payload.new.value === true) {
                        checkMaintenance() // Re-check to verify role
                        toast('メンテナンスモードが開始されました', { icon: '⚠' })
                    } else {
                        if (pathname === '/maintenance') {
                            router.replace('/')
                            toast.success('メンテナンスが終了しました')
                        }
                    }
                }
            )
            .subscribe()

        const checkForceLogout = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Initial fetch to set ref
            const { data: initialProfile } = await supabase
                .from('profiles')
                .select('force_logout_at')
                .eq('id', user.id)
                .single()

            if (initialProfile) {
                lastLogoutAt.current = initialProfile.force_logout_at
            }

            const profileChannel = supabase
                .channel(`profile_guard_${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                    async (payload) => {
                        // If force_logout_at changed
                        if (payload.new.force_logout_at !== payload.old.force_logout_at) {
                            // 1. Log Security Event
                            await logSecurityEvent(user.id, 'Force Logout Triggered')

                            // 2. Set LocalStorage Lockout (24 hours)
                            const lockoutUntil = Date.now() + (24 * 60 * 60 * 1000)
                            localStorage.setItem('security_lockout_until', lockoutUntil.toString())

                            // 3. Logout
                            await supabase.auth.signOut()
                            toast.error('当アカウントは管理者により強制的にログアウトされました。\n24時間のセキュリティ保護が適用されます。')
                            router.replace('/login')
                        }
                        // Update ref so polling doesn't trigger again
                        lastLogoutAt.current = payload.new.force_logout_at
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(profileChannel)
            }
        }

        // 3. Polling Fallback (Every 5 seconds)
        const pollStatus = async () => {
            // Poll Maintenance
            await checkMaintenance()

            // Poll Force Logout
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('force_logout_at')
                    .eq('id', user.id)
                    .single()

                if (profile) {
                    // If ref is set and different -> Logout
                    // Note: If realtime handled it, ref would be updated.
                    if (lastLogoutAt.current !== null && profile.force_logout_at !== lastLogoutAt.current) {
                        // 1. Log Security Event
                        await logSecurityEvent(user.id, 'Force Logout Triggered (Polling)')

                        // 2. Set LocalStorage Lockout (24 hours)
                        const lockoutUntil = Date.now() + (24 * 60 * 60 * 1000)
                        localStorage.setItem('security_lockout_until', lockoutUntil.toString())

                        await supabase.auth.signOut()
                        toast.error('当アカウントは管理者により強制的にログアウトされました。\n24時間のセキュリティ保護が適用されます。')
                        router.replace('/login')
                    }
                    lastLogoutAt.current = profile.force_logout_at
                }
            }
        }

        // Initial checks
        checkMaintenance()
        const cleanupProfile = checkForceLogout()

        // Start Polling
        const intervalId = setInterval(pollStatus, 5000)

        return () => {
            supabase.removeChannel(settingsChannel)
            cleanupProfile.then(cleanup => cleanup && cleanup())
            clearInterval(intervalId)
        }
    }, [pathname, router, supabase])

    return <>{children}</>
}
