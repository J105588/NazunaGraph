// Alpha-9 Security Middleware

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Trap paths (Honeypot) - accessing these bans the IP
const TRAP_PATHS = [
    // Generic high-risk
    '/wp-admin',
    '/.env',

    // Project-specific sensitive files (Should never be accessed via browser)
    '/.env.local',
    '/package.json',
    '/package-lock.json',
    '/next.config.ts',
    '/next.config.js',
    '/tsconfig.json',
    '/middleware.ts',
    '/supabase/config.json'
]

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const path = request.nextUrl.pathname

    // 1. IP Extraction
    let ip = request.headers.get('x-forwarded-for')
    if (ip) {
        ip = ip.split(',')[0].trim()
    } else {
        ip = 'unknown' // In dev/local without proxy, might be undefined.
    }

    // Identify if this is a HONEYPOT access
    const isTrap = TRAP_PATHS.some(trap => path.startsWith(trap) || path.includes(trap))

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role for Middleware Checks? 
        // WARNING: Using Service Role Key in Middleware exposes it if middleware code is bundled to client? 
        // Next.js Middleware runs on Edge, but we should use standard client if possible.
        // HOWEVER, we need to read security_logs which is restricted.
        // AND write to it if trap.
        // Middleware runs server-side, so env vars are safe *if* not prefixed with NEXT_PUBLIC.
        // `SUPABASE_SERVICE_ROLE_KEY` is usually server-only.
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Autonomous Defense: Honeypot Trigger
    if (isTrap && ip !== 'unknown') {
        console.warn(`[AUTONOMOUS DEFENSE] Trap triggered by ${ip} on ${path}`)

        // Ban the IP immediately
        await supabase
            .from('security_logs')
            .insert({
                user_id: null, // System ban
                ip_address: ip,
                user_agent: request.headers.get('user-agent') || 'unknown',
                reason: `AUTONOMOUS DEFENSE: Trap access (${path})`
            })

        return NextResponse.redirect(new URL('/locked', request.url))
    }

    // 3. Lockout Check
    // Skip checking if already on /locked or static assets
    if (ip !== 'unknown' && !path.startsWith('/locked') && !path.startsWith('/_next') && !path.startsWith('/favicon.ico')) {
        const { data, error } = await supabase
            .from('security_logs')
            .select('created_at')
            .eq('ip_address', ip)
            .is('resolved_at', null)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

        if (data && data.length > 0) {
            // Locked!
            return NextResponse.redirect(new URL('/locked', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
