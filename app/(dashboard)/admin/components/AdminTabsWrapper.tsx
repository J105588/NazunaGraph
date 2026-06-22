'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Tags, Users, Sliders } from 'lucide-react'
import dynamic from 'next/dynamic'
import AdminItemList from './AdminItemList'

const StatusMaster = dynamic(() => import('./StatusMaster'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-48 border border-slate-200" />
})
const CategoryMaster = dynamic(() => import('./CategoryMaster'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-48 border border-slate-200" />
})
const UserManagement = dynamic(() => import('./UserManagement'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-64 border border-slate-200" />
})
const MaintenanceControl = dynamic(() => import('./MaintenanceControl'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-48 border border-slate-200" />
})
const ApiKeyControl = dynamic(() => import('./ApiKeyControl'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-48 border border-slate-200" />
})
const SystemReset = dynamic(() => import('./SystemReset'), {
    loading: () => <div className="animate-pulse bg-slate-100/50 rounded-2xl h-48 border border-slate-200" />
})

type TabType = 'items' | 'master' | 'users' | 'system'

export default function AdminTabsWrapper() {
    const [activeTab, setActiveTab] = useState<TabType>('items')

    const tabs = [
        { id: 'items', label: '登録商品管理', icon: Package },
        { id: 'master', label: 'カテゴリ・ステータス設定', icon: Tags },
        { id: 'users', label: 'ユーザー管理', icon: Users },
        { id: 'system', label: 'システム管理', icon: Sliders },
    ]

    return (
        <div className="space-y-6">
            {/* Tab Selection Row */}
            <div className="flex flex-nowrap overflow-x-auto pb-3 gap-2 border-b border-slate-200 -mx-5 px-5 md:mx-0 md:px-0 scrollbar-none snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 snap-start ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Content Area */}
            <div className="mt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'items' && (
                            <div className="space-y-6">
                                <AdminItemList />
                            </div>
                        )}

                        {activeTab === 'master' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                <StatusMaster />
                                <CategoryMaster />
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <UserManagement />
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                                    <MaintenanceControl />
                                    <ApiKeyControl />
                                </div>
                                <SystemReset />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
