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

// In-memory cache for IP verification to reduce database load.
// Allowed (not locked) IPs are cached for 60 seconds.
const allowedIpsCache = new Map<string, number>()
const CACHE_TTL_MS = 60 * 1000

// Helper to check if IP is a local loopback address
function isLocalIp(ip: string): boolean {
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('fe80:')
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1. Quick static asset & system path exclusion (Early Return)
    // Skip all middleware overhead for internal Next.js assets, favicons, and common static files
    const isStaticAsset = /\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ttf|eot)$/i.test(path)
    const isTrap = TRAP_PATHS.some(trap => path.startsWith(trap) || path.includes(trap))

    if (!isTrap) {
        if (
            path.startsWith('/_next') ||
            path.startsWith('/favicon.ico') ||
            path.startsWith('/locked') ||
            isStaticAsset
        ) {
            return NextResponse.next()
        }
    }

    // 2. IP Extraction (Only performed for dynamic routes / traps)
    let ip = request.headers.get('x-forwarded-for')
    if (ip) {
        ip = ip.split(',')[0].trim()
    } else {
        ip = request.headers.get('x-real-ip') || 'unknown'
    }

    // 3. Skip checks for development or local loopback IPs
    const isDev = process.env.NODE_ENV === 'development'
    const isLocal = ip !== 'unknown' && isLocalIp(ip)

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Lazy Supabase client creator to avoid client initialization for early exits or skipped checks
    const getSupabaseClient = () => {
        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
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
    }

    // 4. Autonomous Defense: Honeypot Trigger
    if (isTrap && ip !== 'unknown') {
        console.warn(`[AUTONOMOUS DEFENSE] Trap triggered by ${ip} on ${path}`)

        // Remove from allowed cache immediately
        allowedIpsCache.delete(ip)

        // Don't write to DB in development/local environments
        if (!isDev && !isLocal) {
            const supabase = getSupabaseClient()
            // Ban the IP immediately
            await supabase
                .from('security_logs')
                .insert({
                    user_id: null, // System ban
                    ip_address: ip,
                    user_agent: request.headers.get('user-agent') || 'unknown',
                    reason: `AUTONOMOUS DEFENSE: Trap access (${path})`
                })
        }

        if (path.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
            )
        }
        return NextResponse.redirect(new URL('/locked', request.url))
    }

    // 5. Lockout Check (Skipped for development or local loopback IPs to maximize speed)
    if (ip !== 'unknown' && !isDev && !isLocal) {
        const now = Date.now()
        const cachedExpiry = allowedIpsCache.get(ip)
        let isLocked = false

        if (cachedExpiry && cachedExpiry > now) {
            // Cache hit - skip database query!
        } else {
            // Cache miss - query database
            const supabase = getSupabaseClient()
            const { data } = await supabase
                .from('security_logs')
                .select('created_at')
                .eq('ip_address', ip)
                .is('resolved_at', null)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .limit(1)

            if (data && data.length > 0) {
                isLocked = true
            } else {
                // Not locked, cache this result
                allowedIpsCache.set(ip, now + CACHE_TTL_MS)
            }
        }

        if (isLocked) {
            // Locked!
            if (path.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } }
                )
            }
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
