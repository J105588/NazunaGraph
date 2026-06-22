'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import dynamic from 'next/dynamic'

const ReactQueryDevtools =
    process.env.NODE_ENV === 'production'
        ? () => null
        : dynamic(
            () =>
                import('@tanstack/react-query-devtools').then((res) => ({
                    default: res.ReactQueryDevtools,
                })),
            { ssr: false }
        )

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster position="bottom-right" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }} />
        </QueryClientProvider>
    )
}
