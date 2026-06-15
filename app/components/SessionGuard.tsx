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

    // Decoupled states to manage routing restrictions without tearing down subscriptions
    const [isMaintenance, setIsMaintenance] = useState<boolean | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isUserLoaded, setIsUserLoaded] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // 1. Listen to Auth State Changes
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setCurrentUser(session?.user || null)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    // 2. User-specific Subscriptions (Force Logout)
    useEffect(() => {
        if (!currentUser) {
            setUserRole(null)
            setIsUserLoaded(true)
            return
        }

        let active = true
        let profileChannel: any = null

        const setupUserSubscription = async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, force_logout_at')
                .eq('id', currentUser.id)
                .single()

            if (!active) return
            if (profile) {
                setUserRole(profile.role)
                lastLogoutAt.current = profile.force_logout_at
            }
            setIsUserLoaded(true)

            profileChannel = supabase
                .channel(`profile_guard_${currentUser.id}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
                    async (payload) => {
                        if (payload.new.force_logout_at !== lastLogoutAt.current) {
                            lastLogoutAt.current = payload.new.force_logout_at
                            await logSecurityEvent(currentUser.id, 'Force Logout Triggered')

                            // Set LocalStorage Lockout (24 hours)
                            const lockoutUntil = Date.now() + (24 * 60 * 60 * 1000)
                            localStorage.setItem('security_lockout_until', lockoutUntil.toString())

                            await supabase.auth.signOut()
                            toast.error('当アカウントは管理者により強制的にログアウトされました。\n24時間のセキュリティ保護が適用されます。')
                            router.replace('/login')
                        }
                    }
                )
                .subscribe()
        }

        setupUserSubscription()

        return () => {
            active = false
            if (profileChannel) supabase.removeChannel(profileChannel)
        }
    }, [supabase, router, currentUser])

    // 3. Global Subscriptions (Maintenance Mode) and Background Polling (Once on Mount)
    useEffect(() => {
        let active = true
        let settingsChannel: any = null
        let intervalId: any = null

        const initGlobalGuard = async () => {
            // Initial Maintenance Mode Fetch
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single()

            if (settings && active) {
                setIsMaintenance(settings.value === true)
            }

            // Realtime Maintenance Subscription
            settingsChannel = supabase
                .channel('system_settings_guard')
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'key=eq.maintenance_mode' },
                    async (payload) => {
                        const newMaintenanceVal = payload.new.value === true
                        setIsMaintenance(newMaintenanceVal)

                        if (newMaintenanceVal) {
                            toast('メンテナンスモードが開始されました', { icon: '⚠' })
                            // Refresh user role on transition
                            const { data: { user: u } } = await supabase.auth.getUser()
                            if (u && active) {
                                const { data: p } = await supabase
                                    .from('profiles')
                                    .select('role')
                                    .eq('id', u.id)
                                    .single()
                                if (p && active) {
                                    setUserRole(p.role)
                                }
                            }
                        } else {
                            toast.success('メンテナンスが終了しました')
                        }
                    }
                )
                .subscribe()

            // Polling Fallback (relaxed to 15 seconds to reduce server load since realtime is active)
            const pollStatus = async () => {
                const { data: s } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'maintenance_mode')
                    .single()
                
                if (s && active) {
                    setIsMaintenance(s.value === true)
                }

                const { data: { user: u } } = await supabase.auth.getUser()
                if (u && active) {
                    const { data: p } = await supabase
                        .from('profiles')
                        .select('role, force_logout_at')
                        .eq('id', u.id)
                        .single()

                    if (p && active) {
                        setUserRole(p.role)
                        if (lastLogoutAt.current !== null && p.force_logout_at !== lastLogoutAt.current) {
                            lastLogoutAt.current = p.force_logout_at
                            await logSecurityEvent(u.id, 'Force Logout Triggered (Polling)')

                            const lockoutUntil = Date.now() + (24 * 60 * 60 * 1000)
                            localStorage.setItem('security_lockout_until', lockoutUntil.toString())

                            await supabase.auth.signOut()
                            toast.error('当アカウントは管理者により強制的にログアウトされました。\n24時間のセキュリティ保護が適用されます。')
                            router.replace('/login')
                        }
                    }
                }
            }

            intervalId = setInterval(pollStatus, 15000)
        }

        initGlobalGuard()

        return () => {
            active = false
            if (settingsChannel) supabase.removeChannel(settingsChannel)
            if (intervalId) clearInterval(intervalId)
        }
    }, [supabase, router])

    // 4. Routing Validation & Redirect Enforcement
    useEffect(() => {
        if (isMaintenance === null || !isUserLoaded) return

        if (isMaintenance) {
            if (userRole !== 'admin') {
                if (pathname !== '/maintenance' && pathname !== '/login') {
                    router.replace('/maintenance')
                }
            }
        } else {
            if (pathname === '/maintenance') {
                router.replace('/')
            }
        }
    }, [pathname, isMaintenance, userRole, isUserLoaded, router])

    return <>{children}</>
}
