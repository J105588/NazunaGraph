'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, ShieldAlert, KeyRound, X, Timer } from 'lucide-react'
import { verifySecurityKey, checkIpLockout, unlockSystem } from '@/app/actions/security'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isLocked, setIsLocked] = useState(false)
    const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null)
    const [timeLeft, setTimeLeft] = useState('')
    const [showUnlockModal, setShowUnlockModal] = useState(false)
    const [securityKey, setSecurityKey] = useState('')

    useEffect(() => {
        const checkServerLockout = async () => {
            // First check local storage (fastest)
            const lockout = localStorage.getItem('security_lockout_until')
            if (lockout) {
                const endTime = parseInt(lockout)
                if (endTime > Date.now()) {
                    setIsLocked(true)
                    setLockoutEndTime(endTime)
                    return
                } else {
                    localStorage.removeItem('security_lockout_until')
                }
            }

            // Then check server (robust)
            try {
                const result = await checkIpLockout()
                if (result.locked && result.lockoutEnd) {
                    setIsLocked(true)
                    setLockoutEndTime(result.lockoutEnd)
                    // Re-set local storage just in case
                    localStorage.setItem('security_lockout_until', result.lockoutEnd.toString())
                }
            } catch (err) {
                console.error(err)
            }
        }
        checkServerLockout()
    }, [])

    useEffect(() => {
        if (!isLocked || !lockoutEndTime) return

        const updateTimer = () => {
            const now = Date.now()
            const diff = lockoutEndTime - now
            if (diff <= 0) {
                setIsLocked(false)
                localStorage.removeItem('security_lockout_until')
                return
            }

            const h = Math.floor(diff / (1000 * 60 * 60))
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((diff % (1000 * 60)) / 1000)
            setTimeLeft(`${h}h ${m}m ${s}s`)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [isLocked, lockoutEndTime])

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await unlockSystem(securityKey)
            if (result.success) {
                // Clear local storage
                localStorage.removeItem('security_lockout_until')
                setIsLocked(false)
                setShowUnlockModal(false)
                toast.success('Security protection lifted')

                // Refresh to ensure clean state
                router.refresh()
            } else {
                toast.error(result.message || 'Unlock failed')
            }
        } catch (error) {
            console.error(error)
            toast.error('Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
        } else {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/group')
                router.refresh()
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
                <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md art-card p-12 relative"
            >
                {isLocked ? (
                    <div className="text-center space-y-8">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
                                <ShieldAlert className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-red-500 mb-2">Security Protection Active</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                この端末は強制ログアウトに伴い、セキュリティ保護のため一時的にロックされています。
                            </p>
                        </div>

                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Remaining Time</p>
                            <p className="text-3xl font-mono text-white flex items-center justify-center gap-3">
                                <Timer className="w-5 h-5 text-gray-500" />
                                {timeLeft}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="text-gray-500 hover:text-white text-xs underline decoration-gray-700 hover:decoration-white transition-all underline-offset-4"
                        >
                            Emergency Unlock
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-12 space-y-4">
                            <h2 className="text-2xl font-light tracking-widest text-white">管理者ログイン</h2>
                            <p className="text-gray-500 text-xs tracking-wider font-light">
                                各団体・実行委員用ポータル
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="art-input text-center bg-transparent border-b border-gray-700 rounded-none px-0 hover:border-gray-500 focus:border-white focus:ring-0"
                                        placeholder="メールアドレス"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="art-input text-center bg-transparent border-b border-gray-700 rounded-none px-0 hover:border-gray-500 focus:border-white focus:ring-0"
                                        placeholder="パスワード"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-center text-red-400 text-xs font-light tracking-wide">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="art-btn w-full"
                                >
                                    {loading ? '認証中...' : 'Login'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm glass-card p-8 rounded-2xl relative border border-red-500/20">
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-red-400" />
                            Security Override
                        </h3>

                        <form onSubmit={handleUnlock} className="space-y-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Admin Security Key</label>
                                <input
                                    type="password"
                                    required
                                    value={securityKey}
                                    onChange={(e) => setSecurityKey(e.target.value)}
                                    className="art-input w-full bg-black/40 border-red-900/50 focus:border-red-500"
                                    placeholder="Enter access key"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-3 rounded-lg transition-all"
                            >
                                {loading ? 'Verifying...' : 'Unlock System'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
