
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    console.log('Fetching groups...')
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            display_name,
            group_name,
            role,
            items (
                id,
                status:status_definitions (
                    color,
                    label
                )
            )
        `)
        .eq('role', 'group')
    // .limit(5)

    if (error) {
        console.error('Error fetching groups:', error)
    } else {
        console.log('Success! Found', data?.length, 'groups')
        if (data?.length > 0) {
            console.log('First group items:', JSON.stringify(data[0].items, null, 2))
        } else {
            // Debug: Check if any profiles exist
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
            console.log('Total profiles in DB:', count)
        }
    }
}

testFetch()
