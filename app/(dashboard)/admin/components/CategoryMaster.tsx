'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { Category } from '@/types'
import { useState } from 'react'
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
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
        refetchInterval: 5000,
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

    if (isLoading) return <div className="p-12"><Loader2 className="animate-spin mx-auto text-white" /></div>

    return (
        <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-serif">Category Configuration</h3>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {/* Create Form */}
                {isCreating && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 mb-3">
                            <input
                                className="art-input flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                placeholder="カテゴリ名"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                            <input
                                className="art-input w-20 bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                placeholder="順序"
                                type="number"
                                value={newSortOrder}
                                onChange={(e) => setNewSortOrder(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-white px-3 py-1 text-xs">キャンセル</button>
                            <button onClick={handleCreate} className="art-btn px-4 py-1.5 text-xs flex items-center gap-1">
                                <Plus size={14} /> 追加
                            </button>
                        </div>
                    </div>
                )}

                {/* List */}
                {categories?.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                        {editingId === cat.id ? (
                            <>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        className="art-input flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                    />
                                    <input
                                        className="art-input w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        type="number"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleUpdate} className="p-2 text-green-400 hover:bg-white/10 rounded"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded"><X size={16} /></button>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono text-gray-400">
                                    {cat.sort_order}
                                </div>
                                <span className="flex-1 font-medium text-white">{cat.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(cat)} className="p-2 text-blue-300 hover:bg-white/10 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-300 hover:bg-white/10 rounded"><Trash2 size={16} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
