'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { StatusDefinition } from '@/types'
import { useState } from 'react'
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

async function fetchStatuses() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('status_definitions')
        .select('*')
        .order('sort_order')

    if (error) throw error
    return data as StatusDefinition[]
}

export default function StatusMaster() {
    const supabase = createClient()
    useRealtimeSubscription('status_definitions', ['admin-statuses'])

    const { data: statuses, isLoading, refetch } = useQuery({
        queryKey: ['admin-statuses'],
        queryFn: fetchStatuses,
        refetchInterval: 5000,
    })

    const [isCreating, setIsCreating] = useState(false)
    const [newLabel, setNewLabel] = useState('')
    const [newColor, setNewColor] = useState('bg-gray-500')
    const [newSortOrder, setNewSortOrder] = useState('10')

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editLabel, setEditLabel] = useState('')
    const [editColor, setEditColor] = useState('')
    const [editSortOrder, setEditSortOrder] = useState('')

    const handleCreate = async () => {
        if (!newLabel) return
        try {
            const { error } = await supabase.from('status_definitions').insert({
                label: newLabel,
                color: newColor,
                sort_order: Number(newSortOrder),
                is_active: true
            })
            if (error) throw error
            toast.success('ステータスを追加しました')
            setNewLabel('')
            setIsCreating(false)
            refetch()
        } catch {
            toast.error('追加に失敗しました')
        }
    }

    const startEdit = (status: StatusDefinition) => {
        setEditingId(status.id)
        setEditLabel(status.label)
        setEditColor(status.color)
        setEditSortOrder(String(status.sort_order))
    }

    const handleUpdate = async () => {
        if (!editingId) return
        try {
            const { error } = await supabase
                .from('status_definitions')
                .update({
                    label: editLabel,
                    color: editColor,
                    sort_order: Number(editSortOrder)
                })
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
        if (!confirm('このステータスを削除しますか？使用中のアイテムがある場合、表示がおかしくなる可能性があります。')) return
        try {
            const { error } = await supabase.from('status_definitions').delete().eq('id', id)
            if (error) throw error
            toast.success('削除しました')
            refetch()
        } catch {
            toast.error('削除できませんでした')
        }
    }

    const colorOptions = [
        'bg-gray-500', 'bg-red-500', 'bg-orange-500',
        'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
        'bg-indigo-500', 'bg-purple-500'
    ]

    if (isLoading) return <div className="p-12"><Loader2 className="animate-spin mx-auto text-white" /></div>

    return (
        <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white font-serif">Status Configuration</h3>
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
                        <div className="flex flex-col gap-3 mb-3">
                            <div className="flex gap-2">
                                <input
                                    className="art-input flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    placeholder="名称 (例: 完売)"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                                <input
                                    className="art-input w-20 bg-black/40 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    placeholder="順序"
                                    type="number"
                                    value={newSortOrder}
                                    onChange={(e) => setNewSortOrder(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {colorOptions.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={`w-6 h-6 rounded-full ${c} ${newColor === c ? 'ring-2 ring-white scale-110' : 'opacity-50'} transition-all`}
                                    />
                                ))}
                            </div>
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
                {statuses?.map((status) => (
                    <div key={status.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                        {editingId === status.id ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        className="art-input flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                    />
                                    <input
                                        className="art-input w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                        type="number"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                    />
                                    <button onClick={handleUpdate} className="p-2 text-green-400 hover:bg-white/10 rounded"><Save size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded"><X size={16} /></button>
                                </div>
                                <div className="flex gap-2">
                                    {colorOptions.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setEditColor(c)}
                                            className={`w-5 h-5 rounded-full ${c} ${editColor === c ? 'ring-2 ring-white scale-110' : 'opacity-30'} transition-all`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                <span className="flex-1 font-medium text-white">{status.label}</span>
                                <span className="text-xs text-gray-500 font-mono">#{status.sort_order}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(status)} className="p-2 text-blue-300 hover:bg-white/10 rounded"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(status.id)} className="p-2 text-red-300 hover:bg-white/10 rounded"><Trash2 size={16} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
