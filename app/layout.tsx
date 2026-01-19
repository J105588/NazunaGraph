import type { Metadata } from 'next'
import { Inter, Shippori_Mincho } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })
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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ja">
            <body className={`${inter.className} ${mincho.variable} antialiased`} suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
