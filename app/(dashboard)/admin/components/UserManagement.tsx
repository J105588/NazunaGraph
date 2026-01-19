'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, Save, X, Edit2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import ProfileEditor from '@/app/components/ProfileEditor'

import { Category } from '@/types'

async function fetchProfiles() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            category:categories(*)
        `) // Fetch category details
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as (Profile & { category: Category | null })[]
}

async function fetchCategories() {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    return data as Category[]
}

export default function UserManagement() {
    const supabase = createClient()
    const [search, setSearch] = useState('')
    const [editingUser, setEditingUser] = useState<Profile | null>(null)
    const [formData, setFormData] = useState<Partial<Profile>>({})

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchProfiles
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories
    })


    const filteredUsers = users?.filter(user =>
        (user.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.display_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.group_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const handleEdit = (user: Profile) => {
        setEditingUser(user)
        setFormData({
            role: user.role,
            display_name: user.display_name,
            group_name: user.group_name,
            category_id: user.category_id
        })
    }

    const handleSave = async () => {
        if (!editingUser) return

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    category_id: formData.category_id
                })
                .eq('id', editingUser.id)

            if (error) throw error
            toast.success('ユーザー情報を更新しました')
            setEditingUser(null)
            refetch()
        } catch (err) {
            console.error(err)
            toast.error('更新に失敗しました')
        }
    }

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="text-purple-400" />
                        User Management
                    </h3>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="art-input pl-10 bg-black/20"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-400 border-b border-white/10">
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Display Name</th>
                                <th className="p-3">Group Name</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers?.map(user => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-white font-mono">{user.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                            user.role === 'group' ? 'bg-blue-500/20 text-blue-300' :
                                                'bg-gray-700 text-gray-300'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-3 text-gray-400 text-xs">{(user as any).category?.name || '-'}</td>
                                    <td className="p-3 text-gray-300">{user.display_name || '-'}</td>
                                    <td className="p-3 text-gray-300">{user.group_name || '-'}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-400 hover:text-white" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl relative">
                        <button
                            onClick={() => setEditingUser(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-6">Edit User: {editingUser.email}</h3>

                        <div className="space-y-8">
                            {/* Role & Category Management (Admin Only) */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                                <div>
                                    <label className="block text-xs text-purple-300 font-bold mb-2 uppercase tracking-wider">
                                        System Role
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="art-input bg-black/40 w-full"
                                    >
                                        <option value="guest">Guest</option>
                                        <option value="group">Group</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-purple-300 font-bold mb-2 uppercase tracking-wider">
                                        Category Assignment
                                    </label>
                                    <select
                                        value={formData.category_id || ''}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                                        className="art-input bg-black/40 w-full"
                                    >
                                        <option value="">No Category</option>
                                        {categories?.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Update Admin Settings
                                </button>
                            </div>

                            <hr className="border-white/10" />

                            {/* Profile Details */}
                            <div>
                                <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Profile Details</p>
                                <ProfileEditor
                                    profile={editingUser}
                                    onSaveSuccess={() => {
                                        toast.success('Profile details updated');
                                        refetch();
                                        setEditingUser(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
