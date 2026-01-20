import GroupList from './components/GroupList'
import AnimatedTitle from './components/AnimatedTitle'
import LuxuriousBackground from './components/LuxuriousBackground'
import OpeningController from '@/app/(public)/components/OpeningController'

export const dynamic = 'force-dynamic'

export default async function Home() {
    return (
        <main className="min-h-screen p-4 md:p-12 relative overflow-hidden">
            <LuxuriousBackground />

            <OpeningController>
                <div className="max-w-7xl mx-auto space-y-20 pb-20">
                    <header className="flex flex-col items-center justify-center space-y-8 pt-20">
                        <div className="text-center space-y-6 max-w-2xl mx-auto">
                            <AnimatedTitle />
                            <p className="text-gray-400 text-sm tracking-widest font-light">
                                展示団体を選択してください
                            </p>
                        </div>
                    </header>

                    <GroupList />

                    <footer className="text-center text-gray-700 text-xs font-light tracking-widest py-12">
                        © 2026 市川学園 & Junxiang Jin. All rights reserved.
                    </footer>
                </div>
            </OpeningController>
        </main>
    )
}
