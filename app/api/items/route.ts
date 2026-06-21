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

        // 1. Extract key from incoming request
        const apiKeyParam = searchParams.get('api_key')
        const apiKeyHeader = request.headers.get('x-api-key')
        const authHeader = request.headers.get('authorization')
        let bearerToken: string | null = null

        if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
            bearerToken = authHeader.substring(7).trim()
        }

        const providedKey = apiKeyHeader || bearerToken || apiKeyParam

        if (!providedKey) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid or missing API key.' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Initialize a standard supabase client that doesn't rely on browser/cookie context
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // 2. Call the database function to verify the API key on the DB side
        const { data: isValid, error: rpcError } = await supabase
            .rpc('verify_api_key', { provided_key: providedKey })

        if (rpcError) {
            console.error('[API ERROR] Failed to verify API key in DB:', rpcError)
            return NextResponse.json(
                { error: 'Unauthorized', message: 'API key validation failed on the server.' },
                { status: 401, headers: corsHeaders }
            )
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid or missing API key.' },
                { status: 401, headers: corsHeaders }
            )
        }

        // Parse filtering parameters
        const ownerId = searchParams.get('owner_id')
        const categoryId = searchParams.get('category_id')
        const statusId = searchParams.get('status_id')
        const limitStr = searchParams.get('limit')

        // Build the query selecting only safe public columns
        let query = supabase
            .from('items')
            .select(`
                id,
                name,
                description,
                image_url,
                updated_at,
                status_id,
                owner_id,
                status:status_definitions(
                    id,
                    label,
                    color
                ),
                owner:profiles!inner(
                    id,
                    group_name,
                    display_name,
                    description,
                    image_url,
                    category_id,
                    category:categories(
                        id,
                        name
                    )
                )
            `)
            .order('category_id', { foreignTable: 'owner', ascending: true })
            .order('name', { ascending: true })

        if (ownerId) {
            query = query.eq('owner_id', ownerId)
        }

        if (categoryId) {
            const parsed = parseInt(categoryId, 10)
            if (!isNaN(parsed)) {
                query = query.eq('owner.category_id', parsed)
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

        const transformed = (data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            image_url: item.image_url,
            updated_at: item.updated_at,
            status_id: item.status_id,
            owner_id: item.owner_id,
            status: item.status,
            category: item.owner?.category || null,
            category_id: item.owner?.category_id || null,
            owner: {
                id: item.owner?.id,
                group_name: item.owner?.group_name,
                display_name: item.owner?.display_name,
                description: item.owner?.description,
                image_url: item.owner?.image_url
            }
        }))

        return NextResponse.json(transformed, {
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
