import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminItemList from './components/AdminItemList'
import StatusMaster from './components/StatusMaster'
import CategoryMaster from './components/CategoryMaster'
import UserManagement from './components/UserManagement'

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
            <div className="p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                        Admin Control Center
                    </h2>
                    <p className="text-gray-400 mt-1">
                        System Overview & Master Configuration
                    </p>
                </div>
                <div className="flex gap-4">
                    {/* Placeholder for future top-level actions */}
                    <div className="text-xs text-gray-500 bg-white/5 py-1 px-3 rounded-full border border-white/5 backdrop-blur-md">
                        System Good
                    </div>
                </div>
            </header>

            {/* Config Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <StatusMaster />
                <CategoryMaster />
            </div>

            {/* User Management */}
            <UserManagement />

            {/* Main Item List (Full Width) */}
            <AdminItemList />
        </div>
    )
}
