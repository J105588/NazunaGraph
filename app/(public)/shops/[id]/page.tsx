import { createClient } from '@/utils/supabase/server'
import GuestList from '../../components/GuestList'
import LuxuriousBackground from '../../components/LuxuriousBackground'
import { ItemWithDetails } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

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

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    const shopItems = (items || []) as ItemWithDetails[]
    const shopName = profile?.display_name || profile?.group_name || 'Shop'

    return (
        <main className="min-h-screen p-4 md:p-12 relative overflow-hidden">
            <LuxuriousBackground />

            <div className="max-w-7xl mx-auto space-y-12 pb-20">
                <header className="pt-20 space-y-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft size={20} />
                        <span>一覧に戻る</span>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-widest leading-tight">
                        {shopName}
                    </h1>
                    {profile?.group_name && (
                        <p className="text-xl text-gray-400 font-light tracking-widest uppercase">
                            - {profile.group_name} -
                        </p>
                    )}

                    {/* Description */}
                    {profile?.description && (
                        <p className="text-gray-300 max-w-2xl leading-relaxed whitespace-pre-wrap pt-4 opacity-90">
                            {profile.description}
                        </p>
                    )}


                </header>

                <GuestList initialItems={shopItems} ownerId={id} />
            </div>
        </main>
    )
}
