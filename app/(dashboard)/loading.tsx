import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    )
}
