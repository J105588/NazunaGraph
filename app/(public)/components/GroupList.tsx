'use client'

import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'

import { Category } from '@/types'

type GroupProfile = {
    id: string
    display_name: string | null
    group_name: string | null
    items: {
        status: {
            color: string
            label: string
        } | null
    }[]
    category: {
        id: number
        name: string
        sort_order: number
    } | null
}

async function fetchGroups() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            group_name,
            category:categories (
                id,
                name,
                sort_order
            ),
            items (
                status:status_definitions (
                    color,
                    label
                )
            )
        `)
        .in('role', ['group', 'admin'])
        .order('group_name')

    if (error) throw error
    return data as any[] as GroupProfile[]
}

export default function GroupList() {
    const { data: groups, isLoading, error } = useQuery({
        queryKey: ['groups'],
        queryFn: fetchGroups,
        refetchInterval: 10000,
    })

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-white w-8 h-8" /></div>
    }

    if (error) {
        console.error('Group Fetch Error:', error)
        return <div className="text-red-400 text-center">Failed to load exhibitions.</div>
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="text-center text-gray-500 py-20">
                <p className="text-xl">現在、公開されている展示団体はありません。</p>
                <p className="text-sm mt-2">No exhibitions found.</p>
            </div>
        )
    }

    // Group by category
    const groupedGroups: Record<string, GroupProfile[]> = {}
    const categoryOrder: Record<string, number> = {}

    groups.forEach(group => {
        const catName = group.category?.name || 'その他'
        const catOrder = group.category?.sort_order ?? 9999

        if (!groupedGroups[catName]) {
            groupedGroups[catName] = []
            categoryOrder[catName] = catOrder
        }
        groupedGroups[catName].push(group)
    })

    // Sort categories
    const sortedCategories = Object.keys(groupedGroups).sort((a, b) => {
        return (categoryOrder[a] || 9999) - (categoryOrder[b] || 9999)
    })

    // Helper to determine group status
    const getGroupStatus = (items: GroupProfile['items']) => {
        if (!items || items.length === 0) return { label: '準備中', color: 'bg-gray-600', borderColor: 'border-gray-600' }
        const hasAvailable = items.some(i => i.status?.color.includes('green') || i.status?.color.includes('emerald') || i.status?.color.includes('teal'))
        if (hasAvailable) return { label: '販売中', color: 'bg-emerald-500', borderColor: 'border-emerald-500' }
        const hasFew = items.some(i => i.status?.color.includes('yellow') || i.status?.color.includes('orange'))
        if (hasFew) return { label: '残りわずか', color: 'bg-orange-500', borderColor: 'border-orange-500' }
        return { label: '完売 / 準備中', color: 'bg-red-500', borderColor: 'border-red-500' }
    }

    return (
        <div className="space-y-16">
            {sortedCategories.map((catName) => (
                <section key={catName}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white uppercase tracking-widest px-4">
                            {catName}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {groupedGroups[catName].map((group, index) => {
                            const status = getGroupStatus(group.items)

                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link href={`/shops/${group.id}`} className="group block relative h-full">
                                        <div className="art-card h-full p-8 flex flex-col justify-between transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
                                            {/* Status Line */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${status.color}`} />
                                            <div className={`absolute bottom-0 right-0 w-1 h-full ${status.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${status.color} bg-opacity-80 backdrop-blur-md`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <h3 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                                                    {group.display_name || group.group_name || 'Untitled Shop'}
                                                </h3>

                                                {group.display_name && (
                                                    <p className="text-sm text-gray-400 font-light tracking-wider uppercase border-l border-white/20 pl-3">
                                                        {group.group_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-8 flex items-center justify-end text-sm text-gray-400 group-hover:text-white transition-colors">
                                                <span className="mr-2 tracking-widest text-xs">VIEW MENU</span>
                                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}
