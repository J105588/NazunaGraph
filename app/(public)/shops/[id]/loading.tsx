export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-5">
                {/* Custom Loader - Pulse Effect */}
                <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-[bounce_1s_infinite_400ms]"></div>
                </div>

                <h2 className="text-slate-400 font-bold tracking-[0.25em] text-xs animate-pulse uppercase">
                    読み込み中...
                </h2>
            </div>
        </div>
    )
}
