import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from '@/app/components/ProfileEditor'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        // Should not happen if trigger works
        return <div>Profile not found.</div>
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            <header className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-800">
                    団体詳細設定
                </h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    一般公開されるプロフィールの変更と編集を行います
                </p>
            </header>

            <ProfileEditor profile={profile} />
        </div>
    )
}
