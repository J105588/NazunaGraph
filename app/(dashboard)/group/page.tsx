import { createClient } from '@/utils/supabase/server'
import GroupItemList from './components/GroupItemList'

export default async function GroupDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-400">リアルタイムで在庫状況を更新してください</p>
            </header>

            <GroupItemList userId={user.id} />
        </div>
    )
}
