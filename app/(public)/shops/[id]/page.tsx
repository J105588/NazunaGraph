import { createClient } from '@/utils/supabase/server'
import GuestList from '../../components/GuestList'
import LuxuriousBackground from '../../components/LuxuriousBackground'
import { ItemWithDetails } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Store, Tag, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Items for this group
    const { data: items } = await supabase
        .from('items')
        .select(`
            id,
            name,
            description,
            image_url,
            owner_id,
            status_id,
            is_admin_locked,
            updated_at,
            status:status_definitions(
                id,
                label,
                color
            ),
            owner:profiles(
                id,
                group_name,
                display_name,
                description,
                image_url,
                category_id,
                category:categories(
                    id,
                    name
                )
            )
        `)
        .eq('owner_id', id)
        .order('name', { ascending: true })

    const { data: profileData } = await supabase
        .from('profiles')
        .select(`
            id,
            group_name,
            display_name,
            description,
            image_url,
            is_visible,
            category:categories(
                id,
                name,
                sort_order
            )
        `)
        .eq('id', id)
        .single()

    const profile = profileData as any

    if (!profile || profile.is_visible === false) {
        return (
            <main className="min-h-screen p-4 md:p-12 relative overflow-hidden bg-slate-50/50 flex flex-col items-center justify-center">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center shadow-md">
                    <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-slate-800">非公開のページです</h1>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        この団体は現在準備中のため非公開に設定されています。<br />
                        公開されるまでしばらくお待ちください。
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
                    >
                        一覧に戻る
                    </Link>
                    <footer className="text-slate-400 text-[10px] tracking-widest uppercase pt-4">
                        © 2026 市川学園 & Junxiang Jin. All rights reserved.
                    </footer>
                </div>
            </main>
        )
    }

    const shopItems = ((items || []) as any[]).map((item) => ({
        ...item,
        category: item.owner?.category || null,
        category_id: item.owner?.category_id || null
    })) as unknown as ItemWithDetails[]
    const shopName = profile?.display_name || profile?.group_name || '団体'

    return (
        <main className="min-h-screen p-4 md:p-12 relative overflow-hidden bg-slate-50/50">
            <LuxuriousBackground />

            {/* Sticky Navigation Bar */}
            <div className="fixed top-0 left-0 w-full z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-12 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-wide">
                                Nazuna Graph
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-slate-400 tracking-wider">
                            団体詳細メニュー
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-20">

                {/* Back Link Button */}
                <div className="flex items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/85 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all text-sm font-semibold shadow-sm group"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span>一覧に戻る</span>
                    </Link>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-sm relative overflow-hidden">
                    {/* Visual accents */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

                    <div className="space-y-4 max-w-4xl">
                        <div className="flex flex-wrap items-center gap-2">
                            {profile?.category?.name && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
                                    <Tag size={12} />
                                    {profile.category.name}
                                </span>
                            )}
                            {profile?.group_name && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg">
                                    <Store size={12} />
                                    {profile.group_name}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-800 tracking-wide leading-tight">
                            {shopName}
                        </h1>

                        {profile?.description ? (
                            <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-2 max-w-3xl">
                                {profile.description}
                            </p>
                        ) : (
                            <p className="text-slate-400 text-xs italic pt-2">紹介文は登録されていません。</p>
                        )}
                    </div>
                </div>

                {/* Items List Container */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-500 pl-3">
                        メニュー・出品一覧
                    </h2>
                    <GuestList initialItems={shopItems} ownerId={id} />
                </div>
            </div>
        </main>
    )
}
