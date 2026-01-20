'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import OpeningOverlay from './OpeningOverlay'

export default function OpeningController({ children }: { children: React.ReactNode }) {
    const [shouldShow, setShouldShow] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const hasVisited = sessionStorage.getItem('nazuna-visited')
        if (hasVisited) {
            setShouldShow(false)
        } else {
            sessionStorage.setItem('nazuna-visited', 'true')
        }

        // Expose debug command to window
        // @ts-ignore
        window.resetOpening = () => {
            sessionStorage.removeItem('nazuna-visited')
            setShouldShow(true)
        }


        return () => {
            // @ts-ignore
            delete window.resetOpening
        }
    }, [])

    // if (!isMounted) return null // REMOVED

    return (
        <>
            {shouldShow && <OpeningOverlay onComplete={() => setShouldShow(false)} />}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: shouldShow ? 0 : 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </>
    )
}
