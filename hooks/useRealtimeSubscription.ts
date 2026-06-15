'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSubscription(table: string, queryKey: unknown[]) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    // Store queryKey in a ref so the event handler can always read the latest value
    // without triggering useEffect re-runs when its array reference changes.
    const queryKeyRef = useRef(queryKey)
    useEffect(() => {
        queryKeyRef.current = queryKey
    }, [queryKey])

    useEffect(() => {
        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                (payload) => {
                    console.log('Change received!', payload)
                    // Invalidate queries matching the latest queryKey
                    queryClient.invalidateQueries({ queryKey: queryKeyRef.current })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, table])
}
