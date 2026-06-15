'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Category } from '@/types'
import { useState } from 'react'
import { Loader2, Plus, Trash2, Edit2, Save, X, FolderKanban } from 'lucide-react'
import toast from 'react-hot-toast'

async function fetchCategories() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')

    if (error) throw error
    return data as Category[]
}

export default function CategoryMaster() {
    const supabase = createClient()
    useRealtimeSubscription('categories', ['admin-categories'])

    const { data: categories, isLoading, refetch } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: fetchCategories,
        refetchInterval: 60000,
    })

    const [isCreating, setIsCreating] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newSortOrder, setNewSortOrder] = useState('10')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [editSortOrder, setEditSortOrder] = useState('')

    const handleCreate = async () => {
        if (!newCategoryName) return
        try {
            const { error } = await supabase.from('categories').insert({
                name: newCategoryName,
                sort_order: Number(newSortOrder)
            })
            if (error) throw error
            toast.success('カテゴリを追加しました')
            setNewCategoryName('')
            setIsCreating(false)
            refetch()
        } catch {
            toast.error('追加に失敗しました')
        }
    }

    const startEdit = (cat: Category) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditSortOrder(String(cat.sort_order))
    }

    const handleUpdate = async () => {
        if (!editingId) return
        try {
            const { error } = await supabase
                .from('categories')
                .update({ name: editName, sort_order: Number(editSortOrder) })
                .eq('id', editingId)
            if (error) throw error
            toast.success('更新しました')
            setEditingId(null)
            refetch()
        } catch {
            toast.error('更新に失敗しました')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('このカテゴリを削除しますか？紐づいているアイテムがある場合、エラーになる可能性があります。')) return
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
            toast.success('削除しました')
            refetch()
        } catch (err) {
            console.error(err)
            toast.error('削除できませんでした')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 space-y-2">
                <Loader2 className="animate-spin text-indigo-600 w-6 h-6" />
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-indigo-600" />
                    カテゴリ設定マスター
                </h3>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {/* Create Form */}
                {isCreating && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/85 space-y-3 animate-in fade-in">
                        <div className="flex items-center gap-3">
                            <input
                                className="art-input flex-1 bg-white border border-slate-200 text-xs py-2 px-3 text-slate-800"
                                placeholder="カテゴリ名 (例: 模擬店食品)"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <input
                                className="art-input w-20 bg-white border border-slate-200 text-xs py-2 px-3 text-slate-800"
                                placeholder="順序"
                                type="number"
                                value={newSortOrder}
                                onChange={(e) => setNewSortOrder(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/40">
                            <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700 text-xs cursor-pointer">キャンセル</button>
                            <button onClick={handleCreate} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer">
                                <Plus size={12} /> 追加
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                {categories?.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                        {editingId === cat.id ? (
                            <>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        className="art-input flex-1 bg-white border border-slate-200 text-xs py-2 px-3"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                    />
                                    <input
                                        className="art-input w-16 bg-white border border-slate-200 text-xs py-2 px-3"
                                        type="number"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleUpdate} className="p-1.5 text-emerald-600 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer shadow-sm"><Save size={14} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer shadow-sm"><X size={14} /></button>
                            </>
                        ) : (
                            <>
                                <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-500 shadow-sm">
                                    {cat.sort_order}
                                </div>
                                <span className="flex-1 font-bold text-slate-700 text-xs">{cat.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded border border-slate-200/50 cursor-pointer"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-slate-50 rounded border border-slate-200/50 cursor-pointer"><Trash2 size={13} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
