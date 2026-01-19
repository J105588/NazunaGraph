'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function LuxuriousBackground() {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([])

    useEffect(() => {
        // Generate random particles
        const count = 30
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 10 + 10,
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Deep Gradient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black" />

            {/* Subtle Aurora Overlay */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '12s' }} />
            </div>

            {/* Firefly Particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: 0.3,
                        boxShadow: `0 0 ${p.size * 2}px rgba(255, 255, 255, 0.5)`
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Noise Texture Overlay (Re-applying here to ensure it sits on top) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    )
}
