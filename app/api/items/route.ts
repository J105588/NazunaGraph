import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Parse filtering parameters
        const ownerId = searchParams.get('owner_id')
        const categoryId = searchParams.get('category_id')
        const statusId = searchParams.get('status_id')
        const limitStr = searchParams.get('limit')

        // Initialize a standard supabase client that doesn't rely on browser/cookie context
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Build the query selecting only safe public columns
        let query = supabase
            .from('items')
            .select(`
                id,
                name,
                description,
                image_url,
                updated_at,
                category_id,
                status_id,
                owner_id,
                status:status_definitions(
                    id,
                    label,
                    color
                ),
                category:categories(
                    id,
                    name
                ),
                owner:profiles(
                    id,
                    group_name,
                    display_name,
                    description,
                    image_url
                )
            `)
            .order('category_id', { ascending: true })
            .order('name', { ascending: true })

        if (ownerId) {
            query = query.eq('owner_id', ownerId)
        }

        if (categoryId) {
            const parsed = parseInt(categoryId, 10)
            if (!isNaN(parsed)) {
                query = query.eq('category_id', parsed)
            }
        }

        if (statusId) {
            const parsed = parseInt(statusId, 10)
            if (!isNaN(parsed)) {
                query = query.eq('status_id', parsed)
            }
        }

        if (limitStr) {
            const parsed = parseInt(limitStr, 10)
            if (!isNaN(parsed) && parsed > 0) {
                query = query.limit(parsed)
            }
        }

        const { data, error } = await query

        if (error) {
            console.error('[API ERROR] Failed to fetch items:', error)
            return NextResponse.json(
                { error: 'Failed to fetch items', details: error.message },
                { status: 500, headers: corsHeaders }
            )
        }

        return NextResponse.json(data, {
            headers: {
                ...corsHeaders,
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
            }
        })
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[API ERROR] Unexpected internal error:', err)
        return NextResponse.json(
            { error: 'Internal server error', details: errMsg },
            { status: 500, headers: corsHeaders }
        )
    }
}
