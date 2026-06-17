'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ItemWithDetails, StatusDefinition } from '@/types'
import { useState } from 'react'
import { Loader2, Lock, Plus, Edit2, Trash2, Camera, PackageOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import ItemFormModal from './ItemFormModal'

async function fetchGroupItems(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            status:status_definitions(*),
            owner:profiles(
                *,
                category:categories(*)
            )
        `)
        .eq('owner_id', userId)
        .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map((item: any) => ({
        ...item,
        category: item.owner?.category || null,
        category_id: item.owner?.category_id || null
    })) as ItemWithDetails[]
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
    useRealtimeSubscription('system_settings', ['disabled-registration-users'])

    const { data: items, isLoading: itemsLoading, refetch } = useQuery({
        queryKey: ['group-items', userId],
        queryFn: () => fetchGroupItems(userId),
        refetchInterval: 30000,
    })

    const { data: statuses } = useQuery({
        queryKey: ['statuses'],
        queryFn: fetchStatuses,
        refetchInterval: 60000, // Statuses change less often
    })

    const { data: disabledUsers } = useQuery({
        queryKey: ['disabled-registration-users'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'disabled_registration_users')
            return (data && data.length > 0 && Array.isArray(data[0].value)) ? (data[0].value as string[]) : []
        },
        refetchInterval: 60000,
    })

    const isRegistrationDisabled = disabledUsers?.includes(userId) || false

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
        if (isRegistrationDisabled) {
            toast.error('商品の操作権限が制限されています')
            return
        }
        setEditingItem(null)
        setIsModalOpen(true)
    }

    // Helper to translate color name into modern light mode class name
    const getStatusButtonClass = (isActive: boolean, dbColor: string) => {
        if (!isActive) return 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
        const color = dbColor.toLowerCase()
        if (color.includes('green') || color.includes('emerald') || color.includes('teal')) {
            return 'bg-emerald-600 text-white shadow-md shadow-emerald-100/80 scale-105'
        }
        if (color.includes('yellow') || color.includes('orange') || color.includes('amber')) {
            return 'bg-amber-500 text-white shadow-md shadow-amber-100/80 scale-105'
        }
        if (color.includes('red') || color.includes('rose') || color.includes('pink')) {
            return 'bg-rose-600 text-white shadow-md shadow-rose-100/80 scale-105'
        }
        return 'bg-slate-600 text-white shadow-md scale-105'
    }

    if (itemsLoading) {
        return (
            <div className="flex flex-col justify-center items-center p-12 space-y-3">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
                <p className="text-slate-400 text-xs font-semibold">読み込み中...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">

            {isRegistrationDisabled && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>※管理者によって新規商品の追加登録が制限されています。（既存商品のステータス更新や編集は可能です）</span>
                </div>
            )}

            <ItemFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    refetch()
                }}
                initialItem={editingItem}
                userId={userId}
            />

            <div className="flex justify-between items-center bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
                <div>
                    <h3 className="text-base font-bold text-slate-800">登録アイテム一覧</h3>
                    <p className="text-xs text-slate-400 mt-0.5">登録されている商品数: {items?.length || 0}件</p>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isRegistrationDisabled}
                    className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-md ${
                        isRegistrationDisabled
                            ? 'bg-slate-150 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100/50 cursor-pointer'
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    <span>新規追加</span>
                </button>
            </div>

            {items?.length === 0 && (
                <div className="text-center text-slate-400 py-16 bg-white rounded-3xl border-2 border-slate-200 border-dashed max-w-xl mx-auto p-6">
                    <PackageOpen className="w-8 h-8 text-indigo-500/80 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">アイテムが登録されていません</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        右上の「新規追加」ボタンから、最初の商品を登録してください。
                    </p>
                </div>
            )}

            <div className="grid gap-4">
                {items?.map((item) => (
                    <div
                        key={item.id}
                        className={`p-5 rounded-2xl bg-white border transition-all ${
                            item.is_admin_locked 
                                ? 'border-rose-200 bg-rose-50/20' 
                                : 'border-slate-200/85 hover:border-slate-300 hover:shadow-sm'
                        } flex flex-col lg:flex-row lg:items-center justify-between gap-5`}
                    >
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden relative">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <Camera className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 pr-8">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    {item.name}
                                    {item.is_admin_locked && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-200/50 font-bold">
                                            <Lock className="w-2.5 h-2.5" />
                                            ロック中
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-500 text-xs line-clamp-2 max-w-xl font-medium leading-relaxed">
                                    {item.description || '商品の説明はありません。'}
                                </p>
                            </div>
                        </div>

                        {/* Status & Action Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:justify-end w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                            {/* Status Controls */}
                            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                                {statuses?.map((status) => {
                                    const isActive = item.status_id === status.id
                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => updateStatus(item.id, status.id)}
                                            className={`
                                                px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-transparent flex-1 sm:flex-none text-center
                                                ${getStatusButtonClass(isActive, status.color)}
                                            `}
                                        >
                                            <span>{status.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Action Controls (Edit/Delete) */}
                            {!item.is_admin_locked && (
                                <div className="flex gap-2 w-full sm:w-auto justify-end sm:border-l border-slate-200 sm:pl-4">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all cursor-pointer shadow-sm text-xs font-bold w-full sm:w-auto"
                                        title="編集"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>編集</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 rounded-xl text-rose-600 hover:text-rose-700 transition-all cursor-pointer shadow-sm text-xs font-bold w-full sm:w-auto"
                                        title="削除"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>削除</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
