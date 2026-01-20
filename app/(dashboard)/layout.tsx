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
        <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
            <AutoLogoutProvider>
                {/* Sidebar / Mobile Header */}
                <aside className="w-full md:w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-4 md:h-screen sticky top-0 md:fixed z-50">
                    <div className="flex items-center justify-between md:flex-col md:items-start md:space-y-8">
                        <div>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">
                                Nazuna Graph
                            </h1>
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                                {profile.role} Dashboard
                            </p>
                        </div>

                        <DashboardNav role={profile.role} />

                        <div className="md:mt-auto">
                            <form action="/auth/signout" method="post">
                                <button
                                    type="submit"
                                    className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <LogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 p-4 md:p-8">
                    {children}
                </main>
            </AutoLogoutProvider>
        </div>
    )
}
