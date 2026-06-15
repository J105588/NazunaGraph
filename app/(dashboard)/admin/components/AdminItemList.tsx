'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Category, ItemWithDetails, StatusDefinition } from '@/types'
import { Lock, Unlock, Search, Filter, Plus, PackageOpen, ChevronDown } from 'lucide-react'
import AdminItemFormModal from './AdminItemFormModal'
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

async function fetchStatuses() {
    const supabase = createClient()
    const { data } = await supabase.from('status_definitions').select('*').order('sort_order')
    return data as StatusDefinition[] || []
}

const getStatusSelectClass = (statusColor?: string) => {
    const color = statusColor?.toLowerCase() || ''
    if (color.includes('green') || color.includes('emerald') || color.includes('teal')) {
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 focus:ring-emerald-100'
    }
    if (color.includes('yellow') || color.includes('orange') || color.includes('amber')) {
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70 focus:ring-amber-100'
    }
    if (color.includes('red') || color.includes('rose') || color.includes('pink')) {
        return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/70 focus:ring-rose-100'
    }
    return 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 focus:ring-slate-100'
}

export default function AdminItemList() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    useRealtimeSubscription('items', ['admin-items'])
    useRealtimeSubscription('status_definitions', ['statuses'])

    const { data: items, refetch } = useQuery({
        queryKey: ['admin-items'],
        queryFn: fetchAllItems,
        refetchInterval: 5000,
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
        refetchInterval: 10000,
    })

    const { data: statuses } = useQuery({
        queryKey: ['statuses'],
        queryFn: fetchStatuses,
        refetchInterval: 10000,
    })

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const toggleLock = async (id: string, currentLock: boolean) => {
        const { error } = await supabase
            .from('items')
            .update({ is_admin_locked: !currentLock })
            .eq('id', id)

        if (error) toast.error('操作に失敗しました')
        else toast.success(currentLock ? 'ロックを解除しました' : '編集権限をロックしました')
    }

    const updateStatus = async (itemId: string, statusId: number) => {
        // Optimistic Update
        const queryKey = ['admin-items']
        await queryClient.cancelQueries({ queryKey })
        const previousItems = queryClient.getQueryData<ItemWithDetails[]>(queryKey)

        if (previousItems) {
            queryClient.setQueryData<ItemWithDetails[]>(queryKey, (old) => {
                if (!old) return []
                const newStatus = statuses?.find(s => s.id === statusId)
                return old.map(item =>
                    item.id === itemId
                        ? { ...item, status_id: statusId, status: newStatus || item.status }
                        : item
                )
            })
        }

        try {
            const { error } = await supabase
                .from('items')
                .update({ status_id: statusId })
                .eq('id', itemId)

            if (error) throw error
            toast.success('ステータスを更新しました')
        } catch (err) {
            console.error(err)
            toast.error('更新に失敗しました')
            if (previousItems) {
                queryClient.setQueryData(queryKey, previousItems)
            }
        }
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
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
            <AdminItemFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    refetch()
                }}
            />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <PackageOpen className="w-4 h-4 text-indigo-600" />
                        登録商品一覧
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 transition-all cursor-pointer"
                            title="新規アイテム追加"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">登録されている全商品: {filteredItems.length}件</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="商品・団体名で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="art-input w-full sm:w-56 pl-10 py-1.5 text-xs border-slate-200 bg-white"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="art-input w-full sm:w-44 pl-10 pr-8 py-1.5 text-xs border-slate-200 bg-white appearance-none cursor-pointer"
                        >
                            <option value="all">すべてのカテゴリ</option>
                            {categories?.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Responsive Grid list */}
            <div className="grid gap-3">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className={`
                            p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4
                            ${item.is_admin_locked
                                ? 'bg-rose-50/20 border-rose-200'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3.5 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden relative">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-30 text-[10px] text-slate-500 font-bold bg-slate-50">📷</div>
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                    {item.name}
                                    {item.is_admin_locked && <Lock size={12} className="text-rose-500" />}
                                </h4>
                                <div className="text-[11px] font-semibold text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                    <span>団体: <span className="text-slate-600 font-bold">{item.owner?.display_name || item.owner?.group_name || 'N/A'}</span></span>
                                    {item.category?.name && <span className="text-indigo-600 font-bold">{item.category.name}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                            
                            {/* Status Selector dropdown */}
                            <div className="relative flex items-center">
                                <select
                                    value={item.status_id || ''}
                                    onChange={(e) => updateStatus(item.id, Number(e.target.value))}
                                    className={`appearance-none cursor-pointer pl-3.5 pr-8 py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none focus:ring-2 ${getStatusSelectClass(item.status?.color)}`}
                                >
                                    {statuses?.map((msg) => (
                                        <option key={msg.id} value={msg.id} className="text-slate-700 bg-white">
                                            {msg.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>

                            <button
                                onClick={() => toggleLock(item.id, item.is_admin_locked)}
                                className={`
                                    flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer
                                    ${item.is_admin_locked
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }
                                `}
                            >
                                {item.is_admin_locked ? (
                                    <>
                                        <Lock size={12} />
                                        <span>団体編集ロック中</span>
                                    </>
                                ) : (
                                    <>
                                        <Unlock size={12} />
                                        <span>団体編集を許可</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                    該当する商品が見つかりませんでした。
                </div>
            )}
        </div>
    )
}
