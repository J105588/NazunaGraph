'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Timer, KeyRound, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { unlockSystem, checkIpLockout } from '@/app/actions/security'
import toast from 'react-hot-toast'

export default function LockedPage() {
    const router = useRouter()
    const [timeLeft, setTimeLeft] = useState('')
    const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null)
    const [showUnlockModal, setShowUnlockModal] = useState(false)
    const [securityKey, setSecurityKey] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const result = await checkIpLockout()
                if (result.locked && result.lockoutEnd) {
                    setLockoutEndTime(result.lockoutEnd)
                    localStorage.setItem('security_lockout_until', result.lockoutEnd.toString())
                } else {
                    // Not locked on server? Check local storage
                    const localLockout = localStorage.getItem('security_lockout_until')
                    if (localLockout) {
                        const endTime = parseInt(localLockout)
                        if (endTime > Date.now()) {
                            setLockoutEndTime(endTime)
                        } else {
                            // Expired locally too
                            router.replace('/login')
                        }
                    } else {
                        // No lock found anywhere
                        router.replace('/login')
                    }
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchStatus()
    }, [router])

    useEffect(() => {
        if (!lockoutEndTime) return

        const updateTimer = () => {
            const now = Date.now()
            const diff = lockoutEndTime - now
            if (diff <= 0) {
                localStorage.removeItem('security_lockout_until')
                router.replace('/login')
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
    }, [lockoutEndTime, router])

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await unlockSystem(securityKey)
            if (result.success) {
                localStorage.removeItem('security_lockout_until')
                setShowUnlockModal(false)
                toast.success('セキュリティロックが解除されました')
                router.refresh()
                router.replace('/login')
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

    if (!lockoutEndTime) return null

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-50 text-slate-800">
            {/* Ambient Background blobs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
                <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-rose-50 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-100"
            >
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center animate-pulse">
                            <ShieldAlert className="w-10 h-10 text-rose-600" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-rose-600 tracking-tight">アクセスが拒否されました</h1>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-sm mx-auto font-medium">
                            セキュリティ制限アルゴリズムに基づき、不審なログイン試行が行われたため一時的にアクセスをロックしています。
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">自動解除まで</p>
                        <p className="text-3xl font-mono font-bold text-slate-800 flex items-center justify-center gap-2">
                            <Timer className="w-6 h-6 text-slate-400" />
                            {timeLeft}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowUnlockModal(true)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-semibold tracking-wider uppercase transition-colors"
                    >
                        ロックを解除
                    </button>
                </div>
            </motion.div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-xl relative"
                    >
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <KeyRound className="w-5 h-5 text-indigo-600" />
                            緊急キー入力
                        </h3>

                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">管理者用セキュリティキー</label>
                                <input
                                    type="password"
                                    required
                                    value={securityKey}
                                    onChange={(e) => setSecurityKey(e.target.value)}
                                    className="art-input w-full bg-white border border-slate-200 text-center tracking-widest"
                                    placeholder="PASSWORD"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-xs tracking-wider"
                            >
                                {loading ? '検証中...' : 'ロックを解除'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
