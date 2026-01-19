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
            <header>
                <h2 className="text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-400">
                    Settings
                </h2>
                <p className="text-gray-400 mt-1">
                    Manage your public profile and exhibition details.
                </p>
            </header>

            <ProfileEditor profile={profile} />
        </div>
    )
}
