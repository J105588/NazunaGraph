'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function OpeningOverlay({ onComplete }: { onComplete: () => void }) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        // Automatically hide after animation sequence
        // Sequence:
        // 0s - 1.5s: Icon grows
        // 0.5s - 1.5s: Text fades in
        // 2.5s: Start fade out
        const timer = setTimeout(() => {
            setIsVisible(false)
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <AnimatePresence
            onExitComplete={onComplete}
        >
            {isVisible && (
                <motion.div
                    key="opening-overlay"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[100] bg-[#081023] flex flex-col items-center justify-center p-4"
                >
                    {/* Icon Container */}
                    <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8">
                        <motion.div
                            initial={{ clipPath: 'inset(100% 0 0 0)' }}
                            animate={{ clipPath: 'inset(0% 0 0 0)' }}
                            transition={{
                                duration: 1.5,
                                ease: [0.22, 1, 0.36, 1], // Custom cubic bezier for "organic" grow feel
                            }}
                            className="w-full h-full"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/icon.png"
                                alt="Nazuna Graph Logo"
                                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            />
                        </motion.div>
                    </div>

                    {/* Text Container */}
                    <div className="overflow-hidden">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.5,
                                duration: 1.0,
                                ease: "easeOut"
                            }}
                            className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-white to-violet-200 tracking-widest text-center"
                        >
                            Nazuna Graph
                        </motion.h1>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
