'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { StatusDefinition } from '@/types'
import { useState } from 'react'
import { Loader2, Plus, Trash2, Edit2, Save, X, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

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
        refetchInterval: 60000,
    })

    const [isCreating, setIsCreating] = useState(false)
    const [newLabel, setNewLabel] = useState('')
    const [newColor, setNewColor] = useState('bg-gray-500')
    const [newSortOrder, setNewSortOrder] = useState('10')

    const [editingId, setEditingId] = useState<number | null>(null)
    const [editLabel, setEditLabel] = useState('')
    const [editColor, setEditColor] = useState('')
    const [editSortOrder, setEditSortOrder] = useState('')
    const [deleteStatusId, setDeleteStatusId] = useState<number | null>(null)

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

    const handleDelete = (id: number) => {
        setDeleteStatusId(id)
    }

    const executeDelete = async (id: number) => {
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 space-y-2">
                <Loader2 className="animate-spin text-indigo-600 w-6 h-6" />
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col h-full">
            <ConfirmationModal
                isOpen={deleteStatusId !== null}
                onClose={() => setDeleteStatusId(null)}
                onConfirm={() => deleteStatusId !== null && executeDelete(deleteStatusId)}
                title="ステータスを削除しますか？"
                message="このステータスを削除します。使用中のアイテムがある場合、表示がおかしくなる可能性があります。よろしいですか？"
                confirmText="削除する"
                variant="danger"
            />
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-indigo-600" />
                    ステータス設定マスター
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
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/85 space-y-3">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <input
                                    className="art-input flex-1 bg-white border border-slate-200 text-xs py-2 px-3 text-slate-800"
                                    placeholder="名称 (例: 残りわずか)"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                />
                                <input
                                    className="art-input w-20 bg-white border border-slate-200 text-xs py-2 px-3 text-slate-800"
                                    placeholder="順序"
                                    type="number"
                                    value={newSortOrder}
                                    onChange={(e) => setNewSortOrder(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {colorOptions.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={`w-5 h-5 rounded-full ${c} ${newColor === c ? 'ring-2 ring-slate-400 scale-110' : 'opacity-60'} transition-all cursor-pointer`}
                                    />
                                ))}
                            </div>
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
                {statuses?.map((status) => (
                    <div key={status.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
                        {editingId === status.id ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        className="art-input flex-1 bg-white border border-slate-200 text-xs py-2 px-3"
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                    />
                                    <input
                                        className="art-input w-16 bg-white border border-slate-200 text-xs py-2 px-3"
                                        type="number"
                                        value={editSortOrder}
                                        onChange={(e) => setEditSortOrder(e.target.value)}
                                    />
                                    <button onClick={handleUpdate} className="p-1.5 text-emerald-600 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer shadow-sm"><Save size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded border border-slate-200 cursor-pointer shadow-sm"><X size={14} /></button>
                                </div>
                                <div className="flex gap-1.5">
                                    {colorOptions.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setEditColor(c)}
                                            className={`w-5 h-5 rounded-full ${c} ${editColor === c ? 'ring-2 ring-slate-400 scale-110' : 'opacity-60'} transition-all cursor-pointer`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`w-3 h-3 rounded-full ${status.color} shadow-sm`} />
                                <span className="flex-1 font-bold text-slate-700 text-xs">{status.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-bold">SORT: {status.sort_order}</span>
                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(status)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded border border-slate-200/50 cursor-pointer"><Edit2 size={13} /></button>
                                    <button onClick={() => handleDelete(status.id)} className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-slate-50 rounded border border-slate-200/50 cursor-pointer"><Trash2 size={13} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
