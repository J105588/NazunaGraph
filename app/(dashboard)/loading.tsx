import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
            <Loader2 className="w-10 h-10 text-white animate-spin opacity-50" />
        </div>
    )
}
