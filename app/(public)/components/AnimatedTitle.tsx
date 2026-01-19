'use client'

import { motion } from 'framer-motion'

export default function AnimatedTitle() {
    const text = "Nazuna-Graph"

    // Character animation variants
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.3 }
        })
    }

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100,
            }
        },
        hidden: {
            opacity: 0,
            y: 20,
            filter: "blur(10px)",
        }
    }

    return (
        <div className="relative z-10 text-center">
            <motion.h1
                variants={container}
                initial="hidden"
                animate="visible"
                className="text-[10vw] md:text-8xl font-serif font-medium tracking-widest text-white leading-tight drop-shadow-2xl whitespace-nowrap flex justify-center items-center px-1"
            >
                {text.split("").map((char, index) => (
                    <motion.span variants={child} key={index} className="inline-block relative">
                        {char}
                        {/* Shimmer effect overlay */}
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: [0, 1, 0], x: 20 }}
                            transition={{ duration: 2, delay: 2 + (index * 0.1), repeat: Infinity, repeatDelay: 5 }}
                            className="absolute inset-0 text-white/50 blur-sm pointer-events-none"
                        >
                            {char}
                        </motion.span>
                    </motion.span>
                ))}
            </motion.h1>

            <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
                className="h-px w-20 md:w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mt-6 md:mt-8"
            />
        </div>
    )
}
