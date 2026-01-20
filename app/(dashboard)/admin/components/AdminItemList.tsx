'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Category, ItemWithDetails } from '@/types'
import { Lock, Unlock, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState, useMemo } from 'react'

async function fetchAllItems() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      status:status_definitions(*),
      category:categories(*),
      owner:profiles(*)
    `)
        .order('updated_at', { ascending: false })

    if (error) throw error
    return data as ItemWithDetails[]
}

async function fetchCategories() {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    return data as Category[] || []
}

export default function AdminItemList() {
    const supabase = createClient()
    useRealtimeSubscription('items', ['admin-items'])

    const { data: items } = useQuery({
        queryKey: ['admin-items'],
        queryFn: fetchAllItems,
        refetchInterval: 5000,
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        refetchInterval: 10000,
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

    const toggleLock = async (id: string, currentLock: boolean) => {
        const { error } = await supabase
            .from('items')
            .update({ is_admin_locked: !currentLock })
            .eq('id', id)

        if (error) toast.error('操作に失敗しました')
        else toast.success(currentLock ? 'ロック解除' : 'ロックしました')
    }

    const filteredItems = useMemo(() => {
        if (!items) return []
        return items.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.owner?.group_name?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchCategory = selectedCategory === 'all' || item.category_id === selectedCategory
            return matchSearch && matchCategory
        })
    }, [items, searchQuery, selectedCategory])

    return (
        <div className="glass-card p-6 rounded-2xl md:col-span-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold font-serif text-white">Item Management</h3>
                    <p className="text-sm text-gray-400">Total Items: {filteredItems.length}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="art-input w-full sm:w-64 pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="art-input w-full sm:w-48 pl-10 pr-8 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
                        >
                            <option value="all">Every Category</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Responsive Grid list */}
            <div className="grid gap-4">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className={`
                            p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center gap-4
                            ${item.is_admin_locked
                                ? 'bg-red-900/10 border-red-500/20 hover:bg-red-900/20'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }
                        `}
                    >
                        {/* Status Definitions Wrapper for Mobile Layout */}
                        <div className="flex-1 flex items-start gap-4">
                            <div className="w-12 h-12 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-30 text-xs">No Img</div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    {item.name}
                                    {item.is_admin_locked && <Lock size={12} className="text-red-400" />}
                                </h4>
                                <div className="text-sm text-gray-400 flex flex-col sm:flex-row sm:gap-4">
                                    <span className="text-gray-500">User: {item.owner?.group_name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/10 pt-4 md:pt-0 mt-2 md:mt-0 w-full md:w-auto">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status?.color}`}>
                                {item.status?.label}
                            </span>

                            <button
                                onClick={() => toggleLock(item.id, item.is_admin_locked)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                    ${item.is_admin_locked
                                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }
                                `}
                            >
                                {item.is_admin_locked ? (
                                    <>
                                        <Lock size={14} /> Only Admin
                                    </>
                                ) : (
                                    <>
                                        <Unlock size={14} /> Group Edit
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No items found matching your filter.
                </div>
            )}
        </div>
    )
}
