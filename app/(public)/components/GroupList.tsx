'use client'

import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Loader2, Search, Filter, X } from 'lucide-react'
import { useState } from 'react'


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
    return data as unknown as GroupProfile[]
}

export default function GroupList() {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'selling' | 'few' | 'soldout'>('all')

    const { data: groups, isLoading, error } = useQuery({
        queryKey: ['groups'],
        queryFn: fetchGroups,
        refetchInterval: 10000,
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                <p className="text-slate-500 text-sm tracking-wider">読み込み中...</p>
            </div>
        )
    }

    if (error) {
        console.error('Group Fetch Error:', error)
        return (
            <div className="text-rose-500 text-center p-8 bg-rose-50 rounded-2xl border border-rose-100 max-w-md mx-auto">
                <p className="font-semibold">データの取得に失敗しました</p>
                <p className="text-xs text-rose-400 mt-1">再度お試しください。</p>
            </div>
        )
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="text-center text-slate-500 py-20 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto">
                <p className="text-lg font-medium">現在、公開されている展示団体はありません。</p>
                <p className="text-xs text-slate-400 mt-1">No exhibitions found.</p>
            </div>
        )
    }

    // Helper to determine group status
    const getGroupStatus = (items: GroupProfile['items']) => {
        if (!items || items.length === 0) return { label: '準備中', bgClass: 'bg-slate-50 border-slate-200 text-slate-600', dotClass: 'bg-slate-400', glowColor: '#94a3b8', isPreparing: true, key: 'preparing' }

        // Check if ANY item is selling (Green/Teal/Emerald)
        const hasAvailable = items.some(i => i.status?.color.includes('green') || i.status?.color.includes('emerald') || i.status?.color.includes('teal'))
        if (hasAvailable) {
            return {
                label: '販売中',
                bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50',
                dotClass: 'bg-emerald-500',
                glowColor: '#10b981',
                isPreparing: false,
                key: 'selling'
            }
        }

        // Check if ANY item is low stock (Yellow/Orange)
        const hasFew = items.some(i => i.status?.color.includes('yellow') || i.status?.color.includes('orange'))
        if (hasFew) {
            return {
                label: '残りわずか',
                bgClass: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/50',
                dotClass: 'bg-amber-500',
                glowColor: '#f59e0b',
                isPreparing: false,
                key: 'few'
            }
        }

        // Check if ALL items are Preparing (Gray)
        const allPreparing = items.every(i => i.status?.color.includes('gray'))
        if (allPreparing) return { label: '準備中', bgClass: 'bg-slate-50 border-slate-200 text-slate-600', dotClass: 'bg-slate-400', glowColor: '#94a3b8', isPreparing: true, key: 'preparing' }

        // Otherwise assume Sold Out (Red)
        return {
            label: '完売',
            bgClass: 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-100/50',
            dotClass: 'bg-rose-500',
            glowColor: '#ef4444',
            isPreparing: false,
            key: 'soldout'
        }
    }

    // Apply Filters (Search and Status)
    const filteredGroups = groups.filter(group => {
        const displayName = (group.display_name || '').toLowerCase()
        const groupName = (group.group_name || '').toLowerCase()
        const query = searchQuery.toLowerCase()

        // Search filter match
        const matchesSearch = displayName.includes(query) || groupName.includes(query)
        if (!matchesSearch) return false

        // Status filter match
        if (statusFilter !== 'all') {
            const status = getGroupStatus(group.items)
            if (status.key !== statusFilter) return false
        }

        return true
    })

    // Group by category
    const groupedGroups: Record<string, GroupProfile[]> = {}
    const categoryOrder: Record<string, number> = {}

    filteredGroups.forEach(group => {
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

    return (
        <div className="space-y-12">

            {/* Filter and Search Section */}
            <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm space-y-4">
                {/* Search input */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 transition-colors group-focus-within:text-indigo-600" />
                    <input
                        type="text"
                        placeholder="展示名やクラス名で検索..."
                        className="art-input pl-12 pr-10 border border-slate-200 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Status Filter Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        状況で絞り込み:
                    </span>

                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === 'all'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        すべて
                    </button>
                    <button
                        onClick={() => setStatusFilter('selling')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${statusFilter === 'selling'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-100'
                                : 'bg-emerald-50/50 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        販売中
                    </button>
                    <button
                        onClick={() => setStatusFilter('few')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${statusFilter === 'few'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-100'
                                : 'bg-amber-50/50 border-amber-200 text-amber-700 hover:bg-amber-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        残りわずか
                    </button>
                    <button
                        onClick={() => setStatusFilter('soldout')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${statusFilter === 'soldout'
                                ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-100'
                                : 'bg-rose-50/50 border-rose-200 text-rose-700 hover:bg-rose-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        完売
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-16">
                <AnimatePresence mode="popLayout">
                    {sortedCategories.length > 0 ? (
                        sortedCategories.map((catName) => (
                            <motion.section
                                key={catName}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-wider">
                                        {catName}
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-200" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedGroups[catName].map((group, index) => {
                                        const status = getGroupStatus(group.items)

                                        // Define the card content separately
                                        const CardContent = (
                                            <div className={`art-card group h-full flex flex-col justify-between transition-all duration-300 border border-slate-200 bg-white rounded-2xl overflow-hidden ${status.isPreparing
                                                    ? 'bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed shadow-none'
                                                    : 'hover:border-indigo-200 hover:shadow-md'
                                                }`}>

                                                {/* Image Area */}
                                                <div className="relative aspect-[1.5] w-full overflow-hidden bg-slate-100">
                                                    {group.image_url ? (
                                                        <Image
                                                            src={group.image_url}
                                                            alt={group.display_name || ''}
                                                            fill
                                                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                                            <span className="text-4xl">🏫</span>
                                                        </div>
                                                    )}

                                                    {/* Status Badge */}
                                                    <div className="absolute top-3 right-3 z-20">
                                                        <span
                                                            className={`
                                                                inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 text-xs font-semibold rounded-full border bg-white backdrop-blur-md bg-opacity-95 shadow-sm
                                                                ${status.bgClass}
                                                            `}
                                                        >
                                                            <span
                                                                className="pulsing-dot"
                                                                style={{
                                                                    backgroundColor: status.glowColor,
                                                                    '--glow-color': status.glowColor
                                                                } as React.CSSProperties}
                                                            />
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                                            {group.display_name || group.group_name || '名称未設定'}
                                                        </h3>

                                                        {group.display_name && (
                                                            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">
                                                                {group.group_name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="mt-5 flex items-center justify-end text-xs text-slate-400 font-semibold group-hover:text-indigo-600 transition-colors border-t border-slate-100 pt-3">
                                                        {status.isPreparing ? (
                                                            <span className="tracking-wider text-slate-400">準備中</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1">
                                                                詳細を見る
                                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )

                                        return (
                                            <motion.div
                                                key={group.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
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
                            </motion.section>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto"
                        >
                            <span className="text-4xl mb-3">🔍</span>
                            <p className="text-slate-600 font-semibold">該当する店舗が見つかりませんでした</p>
                            <p className="text-slate-400 text-xs mt-1">検索キーワードや絞り込み条件を変えてみてください。</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
