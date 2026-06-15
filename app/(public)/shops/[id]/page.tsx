import { createClient } from '@/utils/supabase/server'
import GuestList from '../../components/GuestList'
import LuxuriousBackground from '../../components/LuxuriousBackground'
import { ItemWithDetails } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Store, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Items for this group
    const { data: items } = await supabase
        .from('items')
        .select(`
            *,
            status:status_definitions(*),
            category:categories(*),
            owner:profiles(*)
        `)
        .eq('owner_id', id)
        .order('category_id', { ascending: true })
        .order('name', { ascending: true })

    const { data: profileData } = await supabase
        .from('profiles')
        .select(`
            id,
            group_name,
            display_name,
            description,
            image_url,
            category:categories(*)
        `)
        .eq('id', id)
        .single()

    const profile = profileData as any

    const shopItems = (items || []) as ItemWithDetails[]
    const shopName = profile?.display_name || profile?.group_name || '店舗'

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
                        <span className="h-4 w-px bg-slate-200 hidden sm:inline-block" />
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-semibold group hidden sm:inline-flex">
                            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                            <span>一覧に戻る</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold group sm:hidden">
                            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                            <span>戻る</span>
                        </Link>
                        <span className="text-xs font-semibold text-slate-400 tracking-wider">
                            団体詳細メニュー
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-16">

                {/* Profile Header Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 md:p-10 shadow-sm relative overflow-hidden mt-6">
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
