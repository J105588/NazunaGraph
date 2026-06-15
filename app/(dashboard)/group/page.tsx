import { createClient } from '@/utils/supabase/server'
import GroupItemList from './components/GroupItemList'

export default async function GroupDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    return (
        <div className="space-y-6">
            <header className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-800">団体ダッシュボード</h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">リアルタイムで商品の在庫状況を更新・管理します</p>
            </header>

            <GroupItemList userId={user.id} />
        </div>
    )
}
