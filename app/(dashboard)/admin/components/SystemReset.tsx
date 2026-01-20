'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, AlertOctagon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SystemReset() {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const handleReset = async () => {
        const confirm1 = confirm('【警告】システムデータを初期化しますか？\n\n・全ての商品データ\n・管理者以外の全ユーザーデータ\n\nが完全に削除されます。\n※カテゴリデータは保持されます。\n\nこの操作は取り消せません。')
        if (!confirm1) return

        const confirm2 = prompt('実行するには "RESET" と入力してください。')
        if (confirm2 !== 'RESET') {
            if (confirm2 !== null) alert('入力が一致しません。操作をキャンセルしました。')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.rpc('reset_system_data')
            if (error) throw error
            toast.success('システムデータを初期化しました')
            // Reload to reflect changes
            window.location.reload()
        } catch (err) {
            // console.error(err)
            toast.error('初期化に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-card p-6 rounded-2xl border border-red-500/20 relative overflow-hidden bg-red-950/20">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertOctagon className="w-24 h-24 text-red-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Trash2 className="text-red-500 w-5 h-5" />
                    <h3 className="text-xl font-bold text-white">System Reset</h3>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                    全ての商品データと、管理者以外のユーザーデータを完全に削除します。<br />カテゴリデータとステータス定義は保持されます。
                </p>

                <button
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                    INITIALIZE DATA
                </button>
            </div>
        </div>
    )
}
