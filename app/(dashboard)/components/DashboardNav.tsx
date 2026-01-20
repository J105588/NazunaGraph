'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardNav({ role }: { role: string }) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/group' && pathname === '/group') return true
        if (path !== '/group' && pathname.startsWith(path)) return true
        return false
    }

    const linkBaseClass = "block px-4 py-2 rounded-lg transition-colors duration-200"
    const activeClass = "bg-white/20 text-white font-medium shadow-sm"
    const inactiveClass = "hover:bg-white/10 text-gray-300 hover:text-white"

    return (
        <nav className="flex space-x-4 md:flex-col md:space-x-0 md:space-y-2 w-full">
            <Link
                href="/group"
                className={`${linkBaseClass} ${isActive('/group') ? activeClass : inactiveClass}`}
            >
                My Items
            </Link>
            {role === 'admin' && (
                <Link
                    href="/admin"
                    className={`${linkBaseClass} ${isActive('/admin') ? activeClass : inactiveClass}`}
                >
                    Admin Panel
                </Link>
            )}
            <Link
                href="/settings"
                className={`${linkBaseClass} ${isActive('/settings') ? activeClass : inactiveClass}`}
            >
                Settings
            </Link>
        </nav>
    )
}
