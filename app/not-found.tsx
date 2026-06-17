'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Compass } from 'lucide-react'
import LuxuriousBackground from '@/app/(public)/components/LuxuriousBackground'

export default function NotFound() {
    const router = useRouter()

    return (
        <main className="min-h-screen flex flex-col justify-center items-center p-4 md:p-12 relative overflow-hidden bg-slate-50/50">
            <LuxuriousBackground />

            {/* Glowing decorative rings */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.3, 0.4, 0.3],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full border border-indigo-200/40 border-dashed"
                />
                <motion.div
                    animate={{
                        scale: [1, 0.95, 1],
                        opacity: [0.15, 0.25, 0.15],
                        rotate: [360, 270, 180, 90, 0]
                    }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full border border-violet-100/50"
                />
            </div>

            <div className="relative z-10 w-full max-w-xl text-center space-y-8 px-4">
                {/* Floating 404 text */}
                <div className="flex justify-center items-center gap-1 select-none">
                    {['4', '0', '4'].map((char, index) => (
                        <motion.span
                            key={index}
                            className="text-8xl md:text-9xl font-extrabold font-outfit bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent drop-shadow-md"
                            animate={{
                                y: [0, -15, 0]
                            }}
                            transition={{
                                duration: 3.5,
                                delay: index * 0.25,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </div>

                {/* Compass spinning gently */}
                <motion.div
                    className="flex justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <div className="bg-white/80 p-3 rounded-full shadow-md border border-slate-100 backdrop-blur-sm">
                        <Compass className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                </motion.div>

                {/* Information Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6"
                >
                    <div className="space-y-2">
                        <span className="text-xs font-semibold tracking-widest text-indigo-600 uppercase font-outfit">
                            404 - PAGE NOT FOUND
                        </span>
                        <h1 className="text-xl md:text-2xl font-bold font-mincho text-slate-800 tracking-wider">
                            お探しのページが見つかりません
                        </h1>
                    </div>

                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent mx-auto" />

                    <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                        アクセスしようとしたページは削除されたか、URLが変更された可能性があります。
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-sm cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            前のページに戻る
                        </button>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg shadow-slate-900/10 cursor-pointer"
                        >
                            <Home className="w-4 h-4" />
                            ホームへ戻る
                        </Link>
                    </div>
                </motion.div>

                {/* Subtle Footer */}
                <footer className="text-slate-400 text-[10px] tracking-widest uppercase pt-4">
                    © 2026 なずな祭実行委員会 & Junxiang Jin. All rights reserved.
                </footer>
            </div>
        </main>
    )
}
