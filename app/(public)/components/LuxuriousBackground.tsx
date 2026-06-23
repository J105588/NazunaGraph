'use client'

import { useEffect, useState } from 'react'

export default function LuxuriousBackground() {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: string; xOffset: string }[]>([])

    useEffect(() => {
        // Generate random particles
        const count = 20
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2, // slightly larger, softer particles
            duration: `${(Math.random() * 12 + 12).toFixed(2)}s`,
            xOffset: `${(Math.random() * 20 - 10).toFixed(2)}px`,
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none bg-[#f8fafc]">
            {/* Elegant light pastel gradient background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 via-sky-50/30 to-indigo-50/40" />

            {/* Soft, warm floating color blobs for high-end look */}
            <div className="absolute inset-0 opacity-40">
                <div 
                    className="absolute -top-[10%] left-[10%] w-[350px] h-[350px] rounded-full blur-[100px] animate-pulse" 
                    style={{ 
                        animationDuration: '10s',
                        background: 'radial-gradient(circle, rgba(165,180,252,0.4) 0%, rgba(255,255,255,0) 70%)' 
                    }} 
                />
                <div 
                    className="absolute top-[40%] right-[5%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse" 
                    style={{ 
                        animationDuration: '14s',
                        background: 'radial-gradient(circle, rgba(253,186,116,0.3) 0%, rgba(255,255,255,0) 70%)' 
                    }} 
                />
                <div 
                    className="absolute -bottom-[10%] left-[20%] w-[380px] h-[380px] rounded-full blur-[100px] animate-pulse" 
                    style={{ 
                        animationDuration: '12s',
                        background: 'radial-gradient(circle, rgba(147,197,253,0.3) 0%, rgba(255,255,255,0) 70%)' 
                    }} 
                />
            </div>

            {/* Soft floating white particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="floating-particle"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        '--duration': p.duration,
                        '--x-offset': p.xOffset,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    )
}
