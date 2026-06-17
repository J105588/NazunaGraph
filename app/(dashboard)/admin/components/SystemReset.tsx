'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, AlertOctagon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

export default function SystemReset() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

    const executeReset = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.rpc('reset_system_data')
            if (error) throw error
            toast.success('システムデータを初期化しました')
            // Reload to reflect changes
            window.location.reload()
        } catch {
            toast.error('初期化に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-rose-50/30 border border-rose-200/80 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
            <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={executeReset}
                title="【警告】システムデータを初期化しますか？"
                message={`・全ての商品データ\n・管理者以外の全ユーザーデータ\n\nが完全に削除されます。\n※カテゴリデータは保持されます。\n\nこの操作は取り消せません。`}
                confirmText="データを完全に初期化する"
                variant="danger"
                requiredInputText="RESET"
                inputPlaceholder="RESET と入力してください"
            />

            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertOctagon className="w-24 h-24 text-rose-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="text-rose-600 w-5 h-5" />
                        <h3 className="text-base font-bold text-rose-800">システム初期化 (Reset)</h3>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                        全ての商品データと、管理者以外のユーザーデータを完全にデータベースから削除し初期状態に戻します。カテゴリ定義とステータス定義は保持されます。
                    </p>
                </div>

                <button
                    onClick={() => setIsResetConfirmOpen(true)}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-100/50 text-xs cursor-pointer pt-2 border-t border-transparent"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                    <span>データを完全に初期化する</span>
                </button>
            </div>
        </div>
    )
}
