'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, ShieldAlert, KeyRound, X, Timer, ArrowLeft } from 'lucide-react'
import { checkIpLockout, unlockSystem } from '@/app/actions/security'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
                toast.success('セキュリティロックが解除されました')

                // Refresh to ensure clean state
                router.refresh()
            } else {
                toast.error(result.message || '解除に失敗しました')
            }
        } catch (error) {
            console.error(error)
            toast.error('認証エラーが発生しました')
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
            setError('メールアドレスまたはパスワードが正しくありません')
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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-50">
            {/* Ambient Background blobs */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-100/50 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-sky-100/50 rounded-full blur-[100px]"></div>
            </div>

            {/* Back to Home Link */}
            <div className="absolute top-6 left-6 z-10">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold group">
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                    <span>一般ページに戻る</span>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-white/80 backdrop-blur-lg border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-100 relative"
            >
                {isLocked ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center animate-pulse">
                                <ShieldAlert className="w-8 h-8 text-rose-600" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-rose-700 mb-2">セキュリティ保護ロック中</h2>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                                ログイン失敗上限に達したため、この端末からのアクセスを一時的に制限しています。
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">自動解除までの時間</p>
                            <p className="text-2xl font-mono font-bold text-slate-800 flex items-center justify-center gap-2">
                                <Timer className="w-4 h-4 text-slate-400" />
                                {timeLeft}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setShowUnlockModal(true)}
                                className="text-slate-400 hover:text-slate-600 text-xs font-semibold underline decoration-slate-300 hover:decoration-slate-500 transition-all underline-offset-4"
                            >
                                緊急解除キーを入力する
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8 space-y-2">
                            <h2 className="text-2xl font-bold text-slate-800 tracking-wide">管理者ログイン</h2>
                            <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                                Nazuna Graph Portal
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 block pl-1">メールアドレス</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="art-input pl-10 text-slate-800 bg-white"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 block pl-1">パスワード</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="art-input pl-10 text-slate-800 bg-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="text-center text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 py-2.5 px-4 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="art-btn w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                                >
                                    {loading ? '認証中...' : 'ログイン'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </motion.div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-xl relative">
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            セキュリティ緊急解除
                        </h3>

                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">管理者セキュリティキー</label>
                                <input
                                    type="password"
                                    required
                                    value={securityKey}
                                    onChange={(e) => setSecurityKey(e.target.value)}
                                    className="art-input w-full bg-white border border-slate-200"
                                    placeholder="セキュリティキーを入力"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-xs tracking-wider"
                            >
                                {loading ? '検証中...' : 'ロックを強制解除'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
