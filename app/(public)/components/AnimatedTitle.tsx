'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function AnimatedTitle() {
    const text = "Nazuna-Graph"
    const [isFirstVisit, setIsFirstVisit] = useState(true)

    useEffect(() => {
        const hasVisited = sessionStorage.getItem('nazuna-visited')
        if (hasVisited) {
            setIsFirstVisit(false)
        } else {
            sessionStorage.setItem('nazuna-visited', 'true')
        }
    }, [])

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
            transition: { type: "tween" as const, duration: 0 } // No transition for hidden state if used
        }
    }

    // Adjust container variant for immediate visibility if not first visit
    const activeContainer = isFirstVisit ? container : {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } }
    }

    // Adjust child variant for immediate visibility if not first visit
    const activeChild = isFirstVisit ? child : {
        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0 } },
        hidden: { opacity: 1, y: 0, filter: "blur(0px)" }
    }

    return (
        <div className="relative z-10 text-center">
            <motion.h1
                key={isFirstVisit ? 'first-visit' : 'subsequent-visit'}
                variants={activeContainer}
                initial="hidden"
                animate="visible"
                className="text-[10vw] md:text-8xl font-serif font-medium tracking-widest text-white leading-tight drop-shadow-2xl whitespace-nowrap flex justify-center items-center px-1"
            >
                {text.split("").map((char, index) => (
                    <motion.span variants={activeChild} key={index} className="inline-block relative">
                        {char}
                        {/* Shimmer effect overlay - only show on first visit animation or keep it? 
                            The original code loop shimmer. If users want "animation only on first visit", 
                            they usually mean the entrance animation. The shimmer is a continuous effect. 
                            I will keep the shimmer as it is a nice idle effect, or remove it if "Animation" implies all/everything.
                            Given the request "Character animation is displayed only for the first time" (implied entrance), 
                            I will assume entrance. But if the user said "Animation", maybe they mean the shimmer too?
                            Usually "First time only" refers to the long intro. The shimmer is subtle. 
                            I'll leave the shimmer for now as it adds life, unless it looks weird appearing instantly.
                            Actually, the shimmer has a long delay and repeat. 
                            I'll preserve the shimmer logic as is, or maybe reduce delay if not first visit?
                            Let's keep it simple: First visit = entrance animation. 
                            Subsequent = Text appears instantly. Shimmer can continue or restart.
                        */}
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
                initial={isFirstVisit ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={isFirstVisit ? { duration: 1.5, delay: 1.5, ease: "easeOut" } : { duration: 0 }}
                className="h-px w-20 md:w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mt-6 md:mt-8"
            />
        </div>
    )
}
