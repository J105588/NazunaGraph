'use client'

import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Loader2 } from 'lucide-react'

import { Category } from '@/types'

type GroupProfile = {
    id: string
    display_name: string | null
    group_name: string | null
    image_url: string | null
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
            image_url,
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
        if (!items || items.length === 0) return { label: '準備中', color: 'bg-gray-600', isPreparing: true }

        // Check if ANY item is selling (Green/Teal/Emerald)
        const hasAvailable = items.some(i => i.status?.color.includes('green') || i.status?.color.includes('emerald') || i.status?.color.includes('teal'))
        if (hasAvailable) return { label: '販売中', color: 'bg-emerald-500', isPreparing: false }

        // Check if ANY item is low stock (Yellow/Orange)
        const hasFew = items.some(i => i.status?.color.includes('yellow') || i.status?.color.includes('orange'))
        if (hasFew) return { label: '残りわずか', color: 'bg-orange-500', isPreparing: false }

        // Check if ALL items are Preparing (Gray)
        const allPreparing = items.every(i => i.status?.color.includes('gray'))
        if (allPreparing) return { label: '準備中', color: 'bg-gray-600', isPreparing: true }

        // Otherwise assume Sold Out (Red)
        return { label: '完売', color: 'bg-red-500', isPreparing: false }
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

                            // Define the card content separately
                            const CardContent = (
                                <div className={`art-card group h-full flex flex-col justify-between transition-all duration-500 overflow-hidden ${status.isPreparing ? 'opacity-70 grayscale cursor-not-allowed' : 'group-hover:-translate-y-2 group-hover:shadow-2xl'}`}>

                                    {/* Image Area - Artistic Aspect Ratio */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                                        {group.image_url ? (
                                            <Image
                                                src={group.image_url}
                                                alt={group.display_name || ''}
                                                fill
                                                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700 font-thin text-2xl md:text-4xl">
                                                <span className="text-4xl opacity-20">🏫</span>
                                            </div>
                                        )}

                                        {/* Prominent Status Badge */}
                                        <div className="absolute top-0 right-0 z-20">
                                            <span
                                                className={`
                                                    block px-2 py-1 md:px-4 md:py-2 text-[10px] md:text-xs font-bold text-white shadow-lg tracking-wider
                                                    ${status.color}
                                                    rounded-bl-xl md:rounded-bl-2xl backdrop-blur-md bg-opacity-90
                                                `}
                                            >
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Color Line */}
                                    <div className={`h-1 w-full ${status.color}`} />

                                    {/* Content Area */}
                                    <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all line-clamp-2">
                                                {group.display_name || group.group_name || 'Untitled Shop'}
                                            </h3>

                                            {group.display_name && (
                                                <p className="text-sm text-gray-400 font-light tracking-wider uppercase border-l border-white/20 pl-3 mb-4">
                                                    {group.group_name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-end text-sm text-gray-400 group-hover:text-white transition-colors border-t border-white/5 pt-4">
                                            {status.isPreparing ? (
                                                <span className="mr-2 tracking-widest text-xs">PREPARING</span>
                                            ) : (
                                                <>
                                                    <span className="mr-2 tracking-widest text-xs">VIEW MENU</span>
                                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )

                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {status.isPreparing ? (
                                        <div className="h-full block relative">{CardContent}</div>
                                    ) : (
                                        <Link href={`/shops/${group.id}`} className="group block relative h-full">
                                            {CardContent}
                                        </Link>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}
