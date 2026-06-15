import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import AutoLogoutProvider from '@/app/components/AutoLogoutProvider'
import DashboardNav from './components/DashboardNav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile to check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Edge case: User exists in Auth but not in Profiles
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
            <AutoLogoutProvider>
                {/* Sidebar / Mobile Header */}
                <aside className="w-full md:w-64 bg-white/90 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200/80 p-5 md:h-screen sticky top-0 md:fixed z-[100] flex flex-col">
                    <div className="flex flex-row md:flex-col items-center justify-between md:items-start md:space-y-8 w-full md:h-full">
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                Nazuna Graph
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest pl-0.5">
                                {profile.role === 'admin' ? '管理者' : '団体'} ダッシュボード
                            </p>
                        </div>

                        <div className="hidden md:block w-full">
                            <DashboardNav role={profile.role} />
                        </div>

                        <div className="md:mt-auto flex items-center gap-4">
                            {/* Dashboard nav in mobile view */}
                            <div className="md:hidden">
                                <DashboardNav role={profile.role} />
                            </div>

                            <form action="/auth/signout" method="post" className="flex items-center">
                                <button
                                    type="submit"
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer border border-transparent hover:border-rose-100"
                                >
                                    <LogOut size={14} />
                                    <span>ログアウト</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 p-5 md:p-10">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </AutoLogoutProvider>
        </div>
    )

}
