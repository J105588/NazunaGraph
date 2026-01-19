export type Profile = {
    id: string
    email: string | null
    role: 'admin' | 'group' | 'guest'
    group_name: string | null // Class Name (e.g., 3-A)
    display_name: string | null // Exhibition Name (e.g., Yakisoba Stand)
    description: string | null // Exhibition Description
    image_url: string | null // Exhibition Hero Image
    category_id: number | null // Assigned by Admin
    created_at: string
}

export type StatusDefinition = {
    id: number
    label: string
    color: string // e.g., 'bg-green-500'
    sort_order: number
    is_active: boolean
}

export type Category = {
    id: number
    name: string
    sort_order: number
}

export type Item = {
    id: string
    name: string
    description: string | null
    owner_id: string
    category_id: number | null
    status_id: number | null
    image_url: string | null
    is_admin_locked: boolean
    updated_at: string
}

export type ItemWithDetails = Item & {
    status: StatusDefinition | null
    category: Category | null
    owner: Profile | null // the group
}
