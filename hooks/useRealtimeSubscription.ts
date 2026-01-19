'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSubscription(table: string, queryKey: any[]) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                (payload) => {
                    console.log('Change received!', payload)
                    // Simply invalidate the query to re-fetch fresh data
                    // This is easier to maintain than optimistic updates for complex lists
                    queryClient.invalidateQueries({ queryKey })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, table, queryKey])
}
