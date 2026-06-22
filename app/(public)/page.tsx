import GroupList, { GroupProfile } from './components/GroupList'
import AnimatedTitle from './components/AnimatedTitle'
import LuxuriousBackground from './components/LuxuriousBackground'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

async function getInitialGroups(): Promise<GroupProfile[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            group_name,
            image_url,
            is_visible,
            category:categories (
                id,
                name,
                sort_order
            ),
            items (
                status:status_definitions (
                    color,
                    label
                )
            )
        `)
        .in('role', ['group', 'admin'])
        .order('group_name')

    if (error) {
        console.error('Failed to pre-fetch groups on server:', error)
        return []
    }
    return (data || []) as unknown as GroupProfile[]
}

export default async function Home() {
    const initialGroups = await getInitialGroups()

    return (
        <main className="min-h-screen p-4 md:p-12 relative overflow-hidden bg-slate-50/50">
            <LuxuriousBackground />

            {/* Sticky Navigation Bar */}
            <div className="fixed top-0 left-0 w-full z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-12 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-wide">
                            Nazuna Graph
                        </span>
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-16 pb-20 pt-10">
                <header className="flex flex-col items-center justify-center space-y-6 pt-20">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <AnimatedTitle />
                        <p className="text-slate-500 text-xs md:text-sm tracking-widest font-medium">
                            現在の各団体の在庫状況を表示しています。
                        </p>
                    </div>
                </header>

                <GroupList initialGroups={initialGroups} />

                <footer className="text-center text-slate-400 text-xs font-light tracking-widest py-16 border-t border-slate-200/50 mt-16 max-w-md mx-auto">
                    © 2026 なずな祭実行委員会 & Junxiang Jin. All rights reserved.
                </footer>
            </div>
        </main>
    )
}

