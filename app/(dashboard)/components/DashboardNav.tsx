'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, Shield } from 'lucide-react'

export default function DashboardNav({ role }: { role: string }) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/group' && pathname === '/group') return true
        if (path !== '/group' && pathname.startsWith(path)) return true
        return false
    }

    const linkBaseClass = "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border"
    const activeClass = "bg-indigo-50 border-indigo-100/50 text-indigo-700 shadow-sm shadow-indigo-50"
    const inactiveClass = "border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-800"

    return (
        <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-2.5 w-full">
            <Link
                href="/group"
                className={`${linkBaseClass} ${isActive('/group') ? activeClass : inactiveClass}`}
            >
                <LayoutDashboard size={18} />
                <span>登録アイテム</span>
            </Link>
            {role === 'admin' && (
                <Link
                    href="/admin"
                    className={`${linkBaseClass} ${isActive('/admin') ? activeClass : inactiveClass}`}
                >
                    <Shield size={18} />
                    <span>管理者パネル</span>
                </Link>
            )}
            <Link
                href="/settings"
                className={`${linkBaseClass} ${isActive('/settings') ? activeClass : inactiveClass}`}
            >
                <Settings size={18} />
                <span>団体詳細設定</span>
            </Link>
        </nav>
    )

}

