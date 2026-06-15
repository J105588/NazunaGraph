'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { ItemWithDetails } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

async function fetchItems(ownerId?: string) {
    const supabase = createClient()
    let query = supabase
        .from('items')
        .select(`
            *,
            status:status_definitions(*),
            category:categories(*),
            owner:profiles(
                id,
                group_name,
                display_name,
                description,
                image_url
            )
        `)
        .order('category_id', { ascending: true })
        .order('name', { ascending: true })

    if (ownerId) {
        query = query.eq('owner_id', ownerId)
    }

    const { data, error } = await query

    if (error) throw error
    return data as ItemWithDetails[]
}

export default function GuestList({ initialItems, ownerId }: { initialItems: ItemWithDetails[], ownerId?: string }) {
    useRealtimeSubscription('items', ['items', ownerId])
    useRealtimeSubscription('status_definitions', ['items', ownerId])

    const { data: items } = useQuery({
        queryKey: ['items', ownerId],
        queryFn: () => fetchItems(ownerId),
        initialData: initialItems,
        refetchInterval: 30000,
        refetchOnWindowFocus: true
    })

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'selling' | 'few' | 'soldout'>('all')

    // Helper to extract status key from color pattern
    const getStatusKey = (color?: string) => {
        if (!color) return 'preparing'
        const c = color.toLowerCase()
        if (c.includes('green') || c.includes('emerald') || c.includes('teal')) return 'selling'
        if (c.includes('yellow') || c.includes('orange')) return 'few'
        if (c.includes('red') || c.includes('rose') || c.includes('pink')) return 'soldout'
        return 'preparing'
    }

    const getStatusStyle = (color?: string) => {
        const key = getStatusKey(color)
        switch (key) {
            case 'selling':
                return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', glow: '#10b981' }
            case 'few':
                return { bg: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500', glow: '#f59e0b' }
            case 'soldout':
                return { bg: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500', glow: '#ef4444' }
            default:
                return { bg: 'bg-slate-100 border-slate-200 text-slate-600', dot: 'bg-slate-400', glow: '#94a3b8' }
        }
    }

    const filteredItems = items?.filter(item => {
        // Search filter
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.owner?.group_name?.toLowerCase().includes(search.toLowerCase())
        if (!matchesSearch) return false

        // Status filter
        if (statusFilter !== 'all') {
            const itemKey = getStatusKey(item.status?.color)
            if (itemKey !== statusFilter) return false
        }

        return true
    })

    return (
        <div className="space-y-8">

            {/* Search and Filters panel */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search Bar */}
                <div className="relative group w-full md:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 transition-colors group-focus-within:text-indigo-600" />
                    <input
                        type="text"
                        placeholder="商品を検索..."
                        className="art-input pl-10 pr-8 py-2 text-sm border-slate-200 bg-white text-slate-800"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        状態:
                    </span>

                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${statusFilter === 'all'
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        すべて
                    </button>
                    <button
                        onClick={() => setStatusFilter('selling')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${statusFilter === 'selling'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                    >
                        販売中
                    </button>
                    <button
                        onClick={() => setStatusFilter('few')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${statusFilter === 'few'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-100'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-50'
                            }`}
                    >
                        残りわずか
                    </button>
                    <button
                        onClick={() => setStatusFilter('soldout')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${statusFilter === 'soldout'
                                ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-100'
                                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-50'
                            }`}
                    >
                        完売
                    </button>
                </div>
            </div>

            {/* Grid of Items */}
            {filteredItems && filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, index) => {
                            const style = getStatusStyle(item.status?.color)

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.2) }}
                                    className="art-card group h-full flex flex-col border border-slate-200 bg-white rounded-2xl overflow-hidden hover:border-indigo-100"
                                >
                                    {/* Image Area */}
                                    <div className="relative aspect-[1.33] w-full overflow-hidden bg-slate-100">
                                        {item.image_url ? (
                                            <Image
                                                src={item.image_url}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold bg-slate-50 text-sm">
                                                No Image
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3 z-20">
                                            <span
                                                className={`
                                                    inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 text-xs font-semibold rounded-full border bg-white backdrop-blur-md bg-opacity-95 shadow-sm
                                                    ${style.bg}
                                                `}
                                            >
                                                <span
                                                    className="pulsing-dot"
                                                    style={{
                                                        backgroundColor: style.glow,
                                                        '--glow-color': style.glow
                                                    } as React.CSSProperties}
                                                />
                                                {item.status?.label || '未設定'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                                {item.name}
                                            </h3>

                                            {item.owner && (
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {item.owner.display_name || item.owner.group_name}
                                                </p>
                                            )}

                                            {item.description ? (
                                                <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-3 font-medium pt-1">
                                                    {item.description}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400 text-xs italic pt-1">商品説明はありません。</p>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium font-mono">
                                            <span>ITEM ID: {item.id.slice(0, 8).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-3xl mb-2">🍽️</span>
                    <p className="text-slate-600 font-semibold">現在、表示できる商品はありません</p>
                    <p className="text-slate-400 text-xs mt-1">検索語句やフィルターをリセットしてください。</p>
                </div>
            )}
        </div>
    )
}
