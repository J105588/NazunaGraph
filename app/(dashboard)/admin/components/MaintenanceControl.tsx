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
            const { data, error } = await supabase
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
    }, [])

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
        } catch (err: any) {
            // console.error(err)
            toast.error('設定の更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-yellow-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-yellow-500 w-5 h-5" />
                        Maintenance Mode
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        有効にすると、管理者以外の全ユーザーのアクセスが制限されます。
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Switch
                        checked={enabled}
                        onChange={toggleMaintenance}
                        disabled={loading}
                        className={`${enabled ? 'bg-yellow-500' : 'bg-gray-700'
                            } relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75`}
                    >
                        <span className="sr-only">Use setting</span>
                        <span
                            aria-hidden="true"
                            className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
                                pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                        >
                            {loading && <Loader2 className="w-4 h-4 text-gray-500 animate-spin m-1" />}
                        </span>
                    </Switch>
                    <span className={`text-sm font-bold ${enabled ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                </div>
            </div>
        </div>
    )
}
