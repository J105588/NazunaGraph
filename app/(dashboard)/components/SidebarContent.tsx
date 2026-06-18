'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut } from 'lucide-react'
import { Profile } from '@/types'
import DashboardNav from './DashboardNav'

type SidebarContentProps = {
    profile: Profile
}

export default function SidebarContent({ profile }: SidebarContentProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => setIsOpen(!isOpen)
    const closeMenu = () => setIsOpen(false)

    return (
        <>
            {/* Desktop & Mobile Header Bar */}
            <div className="flex flex-row md:flex-col items-center justify-between md:items-start md:space-y-8 w-full md:h-full">
                {/* Logo / Title */}
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Nazuna Graph
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest pl-0.5">
                        {profile.role === 'admin' ? '管理者' : '団体'} ダッシュボード
                    </p>
                </div>

                {/* Desktop Nav Links (Hidden on Mobile) */}
                <div className="hidden md:block w-full">
                    <DashboardNav role={profile.role} />
                </div>

                {/* Desktop Logout Button (Hidden on Mobile) */}
                <div className="hidden md:block mt-auto w-full pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-slate-400 font-bold truncate">{profile.email}</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{profile.display_name || profile.group_name || 'No Name'}</p>
                        </div>
                    </div>
                    <form action="/auth/signout" method="post" className="w-full">
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer border border-transparent hover:border-rose-100"
                        >
                            <LogOut size={16} />
                            <span>ログアウト</span>
                        </button>
                    </form>
                </div>

                {/* Mobile Right Controls: Toggle Button */}
                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={toggleMenu}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                        aria-label="メニュー開閉"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer Menu (Slide-out Overlay) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop Blur Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMenu}
                            className="fixed inset-0 top-[73px] bg-slate-900/40 backdrop-blur-sm z-[99] md:hidden"
                        />

                        {/* Navigation Drawer Container */}
                        <motion.div
                            initial={{ y: '-10%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '-10%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 right-0 top-[73px] bg-white border-b border-slate-200 p-6 z-[100] md:hidden shadow-xl flex flex-col gap-6"
                        >
                            {/* User Profile Card inside Drawer */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">ログイン中のユーザー</span>
                                <div className="mt-1">
                                    <p className="text-xs font-bold text-slate-800">{profile.display_name || profile.group_name || '名前未設定'}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{profile.email}</p>
                                </div>
                            </div>

                            {/* Mobile Links - Reuses DashboardNav but styled vertically inside flex-col wrapper */}
                            <div onClick={closeMenu} className="w-full">
                                <DashboardNav role={profile.role} />
                            </div>

                            {/* Sign Out Area */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <form action="/auth/signout" method="post" className="w-full">
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 transition-all cursor-pointer"
                                    >
                                        <LogOut size={14} />
                                        <span>ログアウト</span>
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
