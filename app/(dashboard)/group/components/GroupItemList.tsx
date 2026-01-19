'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ItemWithDetails, StatusDefinition } from '@/types'
import { useState } from 'react'
import { Loader2, Lock, Plus, Edit2, Trash2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import ItemFormModal from './ItemFormModal'

async function fetchGroupItems(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      status:status_definitions(*),
      category:categories(*),
      owner:profiles(*)
    `)
        .eq('owner_id', userId)
        .order('name', { ascending: true })

    if (error) throw error
    return data as ItemWithDetails[]
}

async function fetchStatuses() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('status_definitions')
        .select('*')
        .order('sort_order')

    if (error) throw error
    return data as StatusDefinition[]
}

export default function GroupItemList({ userId }: { userId: string }) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // State for Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ItemWithDetails | null>(null)

    // Realtime subscriptions
    useRealtimeSubscription('items', ['group-items', userId])
    useRealtimeSubscription('status_definitions', ['statuses'])

    const { data: items, isLoading: itemsLoading, refetch } = useQuery({
        queryKey: ['group-items', userId],
        queryFn: () => fetchGroupItems(userId),
        refetchInterval: 5000,
    })

    const { data: statuses } = useQuery({
        queryKey: ['statuses'],
        queryFn: fetchStatuses,
        refetchInterval: 10000, // Statuses change less often
    })

    const updateStatus = async (itemId: string, statusId: number) => {
        // Optimistic Update
        const queryKey = ['group-items', userId]
        await queryClient.cancelQueries({ queryKey })

        const previousItems = queryClient.getQueryData<ItemWithDetails[]>(queryKey)

        if (previousItems) {
            queryClient.setQueryData<ItemWithDetails[]>(queryKey, (old) => {
                if (!old) return []
                return old.map(item =>
                    item.id === itemId ? { ...item, status_id: statusId } : item
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
            // Rollback
            if (previousItems) {
                queryClient.setQueryData(queryKey, previousItems)
            }
        }
    }

    const handleDelete = async (itemId: string) => {
        if (!confirm('本当に削除しますか？')) return
        try {
            const { error } = await supabase.from('items').delete().eq('id', itemId)
            if (error) throw error
            toast.success('削除しました')
            refetch()
        } catch (err) {
            console.error(err)
            toast.error('削除に失敗しました')
        }
    }

    const handleEdit = (item: ItemWithDetails) => {
        if (item.is_admin_locked) {
            toast.error('このアイテムは管理者によりロックされています')
            return
        }
        setEditingItem(item)
        setIsModalOpen(true)
    }

    const handleCreate = () => {
        setEditingItem(null)
        setIsModalOpen(true)
    }

    if (itemsLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-white" /></div>
    }

    return (
        <div className="space-y-8">

            <ItemFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    refetch()
                }}
                initialItem={editingItem}
                userId={userId}
            />

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif text-white">登録アイテム ({items?.length || 0})</h3>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>新規追加</span>
                </button>
            </div>

            {items?.length === 0 && (
                <div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <p className="text-lg mb-2">アイテムがまだありません</p>
                    <p className="text-sm">右上の「新規追加」ボタンから登録してください</p>
                </div>
            )}

            <div className="grid gap-6">
                {items?.map((item) => (
                    <div
                        key={item.id}
                        className={`p-6 rounded-2xl glass-card ${item.is_admin_locked ? 'border-red-500/30 bg-red-900/10' : ''} flex flex-col lg:flex-row lg:items-center justify-between gap-6 group relative`}
                    >
                        {/* Upper controls (Edit/Delete) */}
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!item.is_admin_locked && (
                                <>
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 bg-black/40 hover:bg-black/60 rounded-lg text-white transition-colors backdrop-blur-md"
                                        title="編集"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-red-900/40 hover:bg-red-900/60 rounded-lg text-red-200 transition-colors backdrop-blur-md"
                                        title="削除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden border border-white/10">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📷</div>
                                )}
                            </div>

                            <div className="pt-1">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                                    {item.name}
                                    {item.is_admin_locked && (
                                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                                            <Lock className="w-3 h-3" />
                                            <span>Locked</span>
                                        </div>
                                    )}
                                </h3>
                                <p className="text-gray-400 text-sm mb-1">
                                    <span className="opacity-50 mr-2">Category:</span>
                                    {item.category?.name || '未分類'}
                                </p>
                                <p className="text-gray-500 text-sm line-clamp-2 max-w-lg">
                                    {item.description || '説明文なし'}
                                </p>
                            </div>
                        </div>

                        {/* Status Controls */}
                        <div className="flex flex-wrap gap-2 lg:justify-end min-w-[300px]">
                            {statuses?.map((status) => {
                                const isActive = item.status_id === status.id
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => updateStatus(item.id, status.id)}
                                        disabled={item.is_admin_locked}
                                        className={`
                                            px-4 py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden
                                            ${isActive
                                                ? `${status.color} text-white shadow-lg scale-105 ring-2 ring-white/20`
                                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                                            }
                                            ${item.is_admin_locked ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <span className="relative z-10">{status.label}</span>
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
