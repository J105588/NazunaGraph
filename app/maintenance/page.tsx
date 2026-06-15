import { AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center pt-24 relative overflow-hidden">
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

            {/* Ambient background blob */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-amber-50 rounded-full blur-[80px]"></div>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md w-full shadow-lg">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-full animate-bounce">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                    </div>
                </div>

                <h1 className="text-xl font-bold text-slate-800 mb-3 font-serif">
                    メンテナンス中
                </h1>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                    現在、システムメンテナンスを行っております。<br />
                    終了までしばらくお待ちください。
                </p>

                <div className="flex items-start gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
                    <p className="leading-relaxed">
                        データの整合性を保つため、一時的にアクセスを制限しています。ご迷惑をおかけしますが、ご理解のほどよろしくお願いいたします。
                    </p>
                </div>
            </div>
        </div>
    )
}
