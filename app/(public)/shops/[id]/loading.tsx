export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden">
            {/* Ambient Background - reusing similar style as login/public pages */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] animate-pulse"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Custom Loader - Pulse Effect related to Nazuna's 3 hearts concept */}
                <div className="flex gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-4 h-4 rounded-full bg-yellow-400 animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-4 h-4 rounded-full bg-emerald-500 animate-[bounce_1s_infinite_400ms]"></div>
                </div>

                <h2 className="text-white/80 font-serif tracking-[0.2em] text-sm animate-pulse">
                    LOADING
                </h2>
            </div>
        </div>
    )
}
