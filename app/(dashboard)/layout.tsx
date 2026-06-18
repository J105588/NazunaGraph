import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AutoLogoutProvider from '@/app/components/AutoLogoutProvider'
import SidebarContent from './components/SidebarContent'

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
                    <SidebarContent profile={profile} />
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
