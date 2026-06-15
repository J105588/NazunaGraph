import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminTabsWrapper from './components/AdminTabsWrapper'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return (
            <div className="p-8 text-center min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-rose-600 mb-2">アクセス拒否</h1>
                <p className="text-slate-500 text-sm">このページを表示する権限がありません。</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-wide">
                        管理者コントロールセンター
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                        システム全体の概要とマスター構成設定
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full border border-emerald-200">
                        システム正常稼働中
                    </div>
                </div>
            </header>

            <AdminTabsWrapper />
        </div>
    )
}

