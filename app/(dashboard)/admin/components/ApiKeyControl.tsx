'use client'

import { useState, useEffect } from 'react'
import { getApiKey, generateApiKey } from '@/app/actions/apiKey'
import { Key, Eye, EyeOff, Copy, RefreshCw, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

export default function ApiKeyControl() {
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [visible, setVisible] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    useEffect(() => {
        const fetchKey = async () => {
            try {
                const key = await getApiKey()
                setApiKey(key)
            } catch {
                toast.error('APIキーの取得に失敗しました')
            } finally {
                setLoading(false)
            }
        }
        fetchKey()
    }, [])

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const key = await generateApiKey()
            setApiKey(key)
            setVisible(true)
            toast.success('新しいAPIアクセスキーを生成しました')
        } catch {
            toast.error('APIキーの生成に失敗しました')
        } finally {
            setGenerating(false)
        }
    }

    const triggerGenerate = () => {
        if (apiKey) {
            setIsConfirmOpen(true)
        } else {
            handleGenerate()
        }
    }

    const handleCopy = async () => {
        if (!apiKey) return
        try {
            await navigator.clipboard.writeText(apiKey)
            setCopied(true)
            toast.success('APIキーをクリップボードにコピーしました')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('コピーに失敗しました')
        }
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleGenerate}
                title="APIキーを再生成しますか？"
                message={`新しいAPIキーを生成すると、現在のAPIキーは無効になります。\n\nこのキーを使用しているすべての外部連携システム（デジタルサイネージ、案内パネル等）が一時的に通信できなくなりますのでご注意ください。`}
                confirmText="新しいキーを生成する"
                cancelText="キャンセル"
                variant="warning"
            />

            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Key className="w-24 h-24 text-indigo-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Key className="text-indigo-600 w-5 h-5" />
                        APIアクセスキー設定
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        外部サイネージや連携システムで商品データ取得API（`/api/items`）を呼び出す際に使用する認証キーです。キーによる検証を必要とするため、リクエストに含めてください。
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apiKey ? (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    現在のAPIアクセスキー
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={visible ? apiKey : 'nz_' + '•'.repeat(24)}
                                        className="bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl font-mono flex-1 focus:outline-none text-slate-800 select-all"
                                    />
                                    <button
                                        onClick={() => setVisible(!visible)}
                                        className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-sm"
                                        title={visible ? '非表示' : '表示'}
                                    >
                                        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2.5 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 transition-all cursor-pointer shadow-sm"
                                        title="キーをコピー"
                                    >
                                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50/50 border border-amber-200/80 p-3.5 rounded-2xl text-[11px] text-amber-700 font-medium">
                                APIキーが設定されていません。APIを利用するには「APIキーを生成」ボタンを押してキーを発行してください。
                            </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                            <button
                                onClick={triggerGenerate}
                                disabled={generating}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100/50 text-xs cursor-pointer"
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                <span>{apiKey ? 'APIキーを再生成' : 'APIキーを生成'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
