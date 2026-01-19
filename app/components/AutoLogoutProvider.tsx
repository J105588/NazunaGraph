'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

const LOGOUT_TIMER = 30 * 60 * 1000 // 30 minutes
// const LOGOUT_TIMER = 10 * 1000 // Test: 10 seconds

export default function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const supabase = createClient()
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const resetTimer = () => {
            if (timerRef.current) clearTimeout(timerRef.current)

            timerRef.current = setTimeout(async () => {
                await supabase.auth.signOut()
                toast.error('一定時間操作がなかったためログアウトしました', {
                    duration: 5000,
                    icon: '🔒'
                })
                router.replace('/login')
            }, LOGOUT_TIMER)
        }

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

        // Initial setup
        resetTimer()

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
        }
    }, [router, supabase])

    return <>{children}</>
}
