import { AlertTriangle, Info } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#081025] flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-yellow-500/20 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-4 font-serif">
                    メンテナンス中
                </h1>

                <p className="text-gray-300 mb-8 leading-relaxed">
                    現在、システムメンテナンスを行っております。<br />
                    終了までしばらくお待ちください。
                </p>

                <div className="flex items-start gap-3 text-sm text-gray-400 bg-black/20 p-4 rounded-xl text-left">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                        データの整合性を保つため、一時的にアクセスを制限しています。ご迷惑をおかけしますが、ご理解のほどよろしくお願いいたします。
                    </p>
                </div>
            </div>
        </div>
    )
}
