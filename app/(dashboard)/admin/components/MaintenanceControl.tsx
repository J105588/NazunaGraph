'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

import { Switch } from '@headlessui/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MaintenanceControl() {
    const supabase = createClient()
    const [enabled, setEnabled] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStatus = async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single()

            if (data?.value === true) {
                setEnabled(true)
            }
            setLoading(false)
        }
        fetchStatus()
    }, [supabase])

    const toggleMaintenance = async (checked: boolean) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'maintenance_mode',
                    value: checked,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            setEnabled(checked)
            toast.success(checked ? 'メンテナンスモードを有効にしました' : 'メンテナンスモードを解除しました')
        } catch {
            toast.error('設定の更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col h-full justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertTriangle className="w-24 h-24 text-amber-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-amber-500 w-5 h-5" />
                        メンテナンスモード設定
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                        有効にすると、管理者以外の一般ユーザー・団体ユーザーのアクセスが制限され、専用の告知画面が表示されます。
                    </p>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                    <Switch
                        checked={enabled}
                        onChange={toggleMaintenance}
                        disabled={loading}
                        className={`${enabled ? 'bg-amber-500' : 'bg-slate-200'
                            } relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                    >
                        <span className="sr-only">Toggle maintenance</span>
                        <span
                            aria-hidden="true"
                            className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
                                pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                        >
                            {loading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin m-1" />}
                        </span>
                    </Switch>
                    <span className={`text-xs font-bold tracking-wider ${enabled ? 'text-amber-600' : 'text-slate-400'}`}>
                        {enabled ? '有効化中 (ACTIVE)' : '無効 (INACTIVE)'}
                    </span>
                </div>
            </div>
        </div>
    )
}
