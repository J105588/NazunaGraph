import type { Metadata } from 'next'
import { Outfit, Shippori_Mincho } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
})

const mincho = Shippori_Mincho({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-mincho',
})

export const metadata: Metadata = {
    title: 'Nazuna Graph',
    description: 'Real-time Festival Status Dashboard',
}

import SessionGuard from './components/SessionGuard'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ja">
            <body className={`${outfit.variable} ${mincho.variable} antialiased`} suppressHydrationWarning>
                <Providers>
                    <SessionGuard>
                        {children}
                    </SessionGuard>
                </Providers>
            </body>
        </html>
    )
}

