'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                className="w-full max-w-md art-card p-12"
            >
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
            </motion.div>
        </div>
    )
}
