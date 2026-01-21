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
                toast.success('Security protection lifted')
                router.refresh()
                router.replace('/login')
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

    if (!lockoutEndTime) return null

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black text-white">
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
                <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg art-card p-12 border-red-500/20 shadow-2xl shadow-red-900/10"
            >
                <div className="text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse border border-red-500/20">
                            <ShieldAlert className="w-12 h-12 text-red-500" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold text-red-500 tracking-tight">ACCESS DENIED</h1>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                            Security Protocol Alpha-9 Active.<br />
                            Your IP address has been flagged for suspicious activity or administrative lockout.
                        </p>
                    </div>

                    <div className="bg-black/40 rounded-xl p-6 border border-white/5">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Automatic Release In</p>
                        <p className="text-4xl font-mono text-white flex items-center justify-center gap-3">
                            <Timer className="w-6 h-6 text-red-900" />
                            {timeLeft}
                        </p>
                    </div>

                    <button
                        onClick={() => setShowUnlockModal(true)}
                        className="text-gray-600 hover:text-red-400 text-xs tracking-widest uppercase transition-colors"
                    >
                        Override Protocol
                    </button>
                </div>
            </motion.div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm glass-card p-8 rounded-2xl relative border border-red-500/20 bg-black/50"
                    >
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-red-400" />
                            Admin Override
                        </h3>

                        <form onSubmit={handleUnlock} className="space-y-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 tracking-widest uppercase">Security Key</label>
                                <input
                                    type="password"
                                    required
                                    value={securityKey}
                                    onChange={(e) => setSecurityKey(e.target.value)}
                                    className="art-input w-full bg-black/40 border-red-900/30 focus:border-red-500 text-center tracking-widest"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-4 rounded-lg transition-all text-xs tracking-widest uppercase"
                            >
                                {loading ? 'Verifying...' : 'Execute Unlock'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
