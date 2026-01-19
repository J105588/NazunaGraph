'use client'

import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { ItemWithDetails } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useState } from 'react'

async function fetchItems() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      status:status_definitions(*),
      category:categories(*),
      owner:profiles(*)
    `)
        .order('category_id', { ascending: true })
        .order('name', { ascending: true })

    if (error) throw error
    return data as ItemWithDetails[]
}

export default function GuestList({ initialItems }: { initialItems: ItemWithDetails[] }) {
    useRealtimeSubscription('items', ['items'])
    useRealtimeSubscription('status_definitions', ['items'])

    const { data: items } = useQuery({
        queryKey: ['items'],
        queryFn: fetchItems,
        initialData: initialItems,
        refetchInterval: 5000,
        refetchOnWindowFocus: true
    })

    const [search, setSearch] = useState('')

    const filteredItems = items?.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.owner?.group_name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-16">
            {/* Minimal Search */}
            <div className="relative max-w-md mx-auto z-10">
                <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5 transition-colors group-hover:text-white" />
                    <input
                        type="text"
                        placeholder="検索 (展示団体、商品名...)"
                        className="art-input pl-14"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-fr">
                <AnimatePresence>
                    {filteredItems?.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="art-card group h-full flex flex-col"
                        >
                            {/* Image Area - Artistic Aspect Ratio */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                                {item.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700 font-thin text-4xl">
                                        No Image
                                    </div>
                                )}

                                {/* Prominent Status Badge */}
                                <div className="absolute top-0 right-0 z-20">
                                    <span
                                        className={`
                                                block px-4 py-2 text-xs font-bold text-white shadow-lg tracking-wider
                                                ${item.status?.color || 'bg-gray-500'}
                                                rounded-bl-2xl backdrop-blur-md bg-opacity-90
                                            `}
                                    >
                                        {item.status?.label || '未設定'}
                                    </span>
                                </div>
                            </div>

                            {/* Status Color Line */}
                            <div className={`h-1 w-full ${item.status?.color || 'bg-gray-800'}`} />

                            {/* Content - Spacious and Clean */}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-serif font-medium text-white mb-3 tracking-wide group-hover:text-gray-200 transition-colors">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-4 font-sans tracking-widest uppercase border-l-2 border-white/20 pl-3">
                                        <span className="text-white font-bold opacity-90 mr-2">
                                            {item.owner?.display_name || item.owner?.group_name || '有志団体'}
                                        </span>
                                        <span className="opacity-50">
                                            {item.owner?.display_name ? `(${item.owner?.group_name})` : ''}
                                        </span>
                                    </p>
                                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 font-light">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-600 font-light">
                                    <span>商品ID: {item.id.slice(0, 4)}</span>
                                    <span>Last Updated</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
