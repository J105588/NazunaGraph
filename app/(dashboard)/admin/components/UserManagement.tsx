'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, X, Edit2, ShieldCheck, LogOut, KeyRound, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import ProfileEditor from '@/app/components/ProfileEditor'
import { resetUserPassword, createUser } from '@/app/actions/admin'
import { Switch } from '@headlessui/react'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

import { Category } from '@/types'

async function fetchProfiles() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            category:categories(*)
        `)
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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createFormData, setCreateFormData] = useState({
        email: '',
        password: '',
        role: 'group',
        group_name: ''
    })
    const [forceLogoutUser, setForceLogoutUser] = useState<{ id: string; email: string } | null>(null)
    const [resettingUser, setResettingUser] = useState<{ id: string; email: string } | null>(null)
    const [newPassword, setNewPassword] = useState('')

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['admin-users'],
        queryFn: fetchProfiles
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories
    })

    // Subscribe to system_settings changes
    useRealtimeSubscription('system_settings', ['disabled-registration-users'])
    // Subscribe to profiles changes
    useRealtimeSubscription('profiles_data', ['admin-users'])

    const { data: disabledUsers, refetch: refetchDisabledUsers } = useQuery({
        queryKey: ['disabled-registration-users'],
        queryFn: async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'disabled_registration_users')
            return (data && data.length > 0 && Array.isArray(data[0].value)) ? (data[0].value as string[]) : []
        }
    })

    const handleToggleRegistration = async (targetUserId: string, currentlyAllowed: boolean) => {
        const currentDisabled = disabledUsers || []
        let newDisabled: string[]
        if (currentlyAllowed) {
            newDisabled = [...currentDisabled, targetUserId]
        } else {
            newDisabled = currentDisabled.filter(id => id !== targetUserId)
        }

        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'disabled_registration_users',
                    value: newDisabled,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            toast.success(currentlyAllowed ? 'アイテム登録を「不可」に設定しました' : 'アイテム登録を「許可」に設定しました')
            refetchDisabledUsers()
        } catch (err) {
            console.error(err)
            toast.error('設定の変更に失敗しました')
        }
    }

    const handleToggleVisibility = async (targetUserId: string, currentlyVisible: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_visible: !currentlyVisible })
                .eq('id', targetUserId)

            if (error) throw error
            toast.success(!currentlyVisible ? '公開に設定しました' : '非公開に設定しました')
            refetch()
        } catch (err) {
            console.error(err)
            toast.error('設定の変更に失敗しました')
        }
    }

    const filteredUsers = users?.filter(user =>
        (user.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.display_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.group_name?.toLowerCase() || '').includes(search.toLowerCase())
    )

    const handleForceLogout = (userId: string, userEmail: string) => {
        setForceLogoutUser({ id: userId, email: userEmail })
    }

    const executeForceLogout = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ force_logout_at: new Date().toISOString() })
                .eq('id', userId)

            if (error) throw error
            toast.success('強制ログアウトを実行しました')
        } catch (err) {
            console.error(err)
            toast.error('操作に失敗しました')
        }
    }

    const handlePasswordReset = (userId: string, userEmail: string) => {
        setResettingUser({ id: userId, email: userEmail })
    }

    const handleEdit = (user: Profile) => {
        setEditingUser(user)
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const formData = new FormData()
            formData.append('email', createFormData.email)
            formData.append('password', createFormData.password)
            formData.append('role', createFormData.role)
            formData.append('group_name', createFormData.group_name)

            await createUser(formData)

            toast.success('ユーザーを作成しました')
            setIsCreateModalOpen(false)
            setCreateFormData({
                email: '',
                password: '',
                role: 'group',
                group_name: ''
            })
            refetch()
        } catch (err: unknown) {
            console.error(err)
            const errMsg = err instanceof Error ? err.message : 'エラーが発生しました'
            toast.error(`作成に失敗しました: ${errMsg}`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 space-y-2">
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600 w-5 h-5" />
                    ユーザー管理パネル
                </h3>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-indigo-100/50 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    <span>新規ユーザー追加</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="名前、メール、団体名で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="art-input pl-10 border border-slate-200 bg-white py-1.5 text-xs text-slate-800"
                />
            </div>

            <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full text-left text-xs hidden md:table border-collapse">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-200 font-bold">
                            <th className="p-3">メールアドレス</th>
                            <th className="p-3">システム権限</th>
                            <th className="p-3">所属カテゴリ</th>
                            <th className="p-3">表示名</th>
                            <th className="p-3">クラス・団体名</th>
                            <th className="p-3">公開状態</th>
                            <th className="p-3">アイテム登録許可</th>
                            <th className="p-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers?.map(user => (
                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-mono text-slate-700 font-medium">{user.email}</td>
                                <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${user.role === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                        user.role === 'group' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                                            'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-3 text-slate-500 font-bold">{user.category?.name || '-'}</td>
                                <td className="p-3 text-slate-700 font-semibold">{user.display_name || '-'}</td>
                                <td className="p-3 text-slate-500 font-bold">{user.group_name || '-'}</td>
                                <td className="p-3">
                                    {user.role === 'group' || user.role === 'admin' ? (
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={user.is_visible !== false}
                                                onChange={() => handleToggleVisibility(user.id, user.is_visible !== false)}
                                                className={`${user.is_visible !== false ? 'bg-indigo-600' : 'bg-slate-200'
                                                    } relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`${user.is_visible !== false ? 'translate-x-4' : 'translate-x-0'}
                                                        pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </Switch>
                                            <span className={`text-[10px] font-bold ${user.is_visible !== false ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {user.is_visible !== false ? '公開' : '非公開'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="p-3">
                                    {user.role === 'group' ? (
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={!disabledUsers?.includes(user.id)}
                                                onChange={() => handleToggleRegistration(user.id, !disabledUsers?.includes(user.id))}
                                                className={`${!disabledUsers?.includes(user.id) ? 'bg-indigo-600' : 'bg-slate-200'
                                                    } relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`${!disabledUsers?.includes(user.id) ? 'translate-x-4' : 'translate-x-0'}
                                                        pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </Switch>
                                            <span className={`text-[10px] font-bold ${!disabledUsers?.includes(user.id) ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {!disabledUsers?.includes(user.id) ? '許可' : '不可'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer shadow-sm"
                                            title="ユーザー編集"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handlePasswordReset(user.id, user.email || '')}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-amber-600 hover:text-amber-700 transition-all cursor-pointer shadow-sm"
                                            title="パスワード変更"
                                        >
                                            <KeyRound className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleForceLogout(user.id, user.email || '')}
                                            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-rose-500 hover:text-rose-600 transition-all cursor-pointer shadow-sm"
                                            title="強制ログアウト"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {filteredUsers?.map(user => (
                        <div key={user.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                            <div className="flex justify-between items-start mb-2">
                                <div className="overflow-hidden">
                                    <div className="text-slate-800 font-mono text-xs font-bold truncate">{user.email}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{user.display_name || '名前未設定'}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ml-2 ${user.role === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                    user.role === 'group' ? 'bg-sky-50 border-sky-200 text-sky-700' :
                                        'bg-slate-150 border-slate-300 text-slate-600'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold mb-3 mt-2">
                                <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                                    <span className="block text-[8px] text-slate-400">団体名</span>
                                    <span className="truncate block">{user.group_name || '-'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                                    <span className="block text-[8px] text-slate-400">カテゴリ</span>
                                    <span className="truncate block">{user.category?.name || '-'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                                    <span className="block text-[8px] text-slate-400">公開状態</span>
                                    {user.role === 'group' || user.role === 'admin' ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Switch
                                                checked={user.is_visible !== false}
                                                onChange={() => handleToggleVisibility(user.id, user.is_visible !== false)}
                                                className={`${user.is_visible !== false ? 'bg-indigo-600' : 'bg-slate-200'
                                                    } relative inline-flex h-[16px] w-[28px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`${user.is_visible !== false ? 'translate-x-3' : 'translate-x-0'}
                                                        pointer-events-none inline-block h-[12px] w-[12px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </Switch>
                                            <span className={`text-[9px] font-bold ${user.is_visible !== false ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {user.is_visible !== false ? '公開' : '非公開'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 font-normal">-</span>
                                    )}
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                                    <span className="block text-[8px] text-slate-400">アイテム登録</span>
                                    {user.role === 'group' ? (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Switch
                                                checked={!disabledUsers?.includes(user.id)}
                                                onChange={() => handleToggleRegistration(user.id, !disabledUsers?.includes(user.id))}
                                                className={`${!disabledUsers?.includes(user.id) ? 'bg-indigo-600' : 'bg-slate-200'
                                                    } relative inline-flex h-[16px] w-[28px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`${!disabledUsers?.includes(user.id) ? 'translate-x-3' : 'translate-x-0'}
                                                        pointer-events-none inline-block h-[12px] w-[12px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                                />
                                            </Switch>
                                            <span className={`text-[9px] font-bold ${!disabledUsers?.includes(user.id) ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {!disabledUsers?.includes(user.id) ? '許可' : '不可'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300 font-normal">-</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3">
                                <button
                                    onClick={() => handleEdit(user)}
                                    className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    <span>編集</span>
                                </button>
                                <button
                                    onClick={() => handlePasswordReset(user.id, user.email || '')}
                                    className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-amber-600 hover:text-amber-700 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                                >
                                    <KeyRound className="w-3 h-3" />
                                    <span>再設定</span>
                                </button>
                                <button
                                    onClick={() => handleForceLogout(user.id, user.email || '')}
                                    className="py-1.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 text-rose-500 rounded-xl cursor-pointer"
                                    title="強制ログアウト"
                                >
                                    <LogOut className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit User Modal Overlay */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl shadow-xl relative">
                        <button
                            onClick={() => setEditingUser(null)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">ユーザー情報の編集: {editingUser.email}</h3>

                        <div className="space-y-6">
                            <ProfileEditor
                                profile={editingUser}
                                isAdminMode={true}
                                categories={categories || []}
                                initialRole={editingUser.role}
                                initialCategoryId={editingUser.category_id}
                                onSaveSuccess={() => {
                                    refetch()
                                    setEditingUser(null)
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl relative border border-slate-200">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            新規ユーザーの作成
                        </h3>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    required
                                    value={createFormData.email}
                                    onChange={e => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="art-input w-full bg-white border border-slate-200"
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">仮パスワード</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createFormData.password}
                                    onChange={e => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="art-input w-full bg-white border border-slate-200"
                                    placeholder="6文字以上のパスワード"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">システム権限</label>
                                <select
                                    value={createFormData.role}
                                    onChange={e => setCreateFormData({ ...createFormData, role: e.target.value })}
                                    className="art-input w-full bg-white border border-slate-200 text-slate-800"
                                >
                                    <option value="group">Group (各団体)</option>
                                    <option value="admin">Admin (システム管理者)</option>
                                </select>
                            </div>

                            {createFormData.role === 'group' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">団体名・クラス名</label>
                                    <input
                                        type="text"
                                        required
                                        value={createFormData.group_name}
                                        onChange={e => setCreateFormData({ ...createFormData, group_name: e.target.value })}
                                        className="art-input w-full bg-white border border-slate-200"
                                        placeholder="例: 4年4組"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-md shadow-indigo-100/50 cursor-pointer"
                            >
                                ユーザーを新規登録
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {resettingUser && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl relative border border-slate-200">
                        <button
                            onClick={() => {
                                setResettingUser(null)
                                setNewPassword('')
                            }}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 font-mincho">
                            <KeyRound className="w-4 h-4 text-indigo-600" />
                            パスワードのリセット
                        </h3>

                        <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600">
                            <span className="font-bold">対象ユーザー:</span> <span className="font-mono text-slate-800">{resettingUser.email}</span>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (newPassword.length < 6) {
                                toast.error('パスワードは6文字以上で入力してください。')
                                return
                            }
                            try {
                                await resetUserPassword(resettingUser.id, newPassword)
                                toast.success('パスワードをリセットしました')
                                setResettingUser(null)
                                setNewPassword('')
                            } catch (err: unknown) {
                                console.error(err)
                                const errMsg = err instanceof Error ? err.message : 'エラーが発生しました'
                                toast.error(`リセットに失敗しました: ${errMsg}`)
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">新しいパスワード</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="art-input w-full bg-white border border-slate-200"
                                    placeholder="6文字以上の新しいパスワード"
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResettingUser(null)
                                        setNewPassword('')
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    パスワードを変更
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Force Logout Confirmation Modal */}
            <ConfirmationModal
                isOpen={forceLogoutUser !== null}
                onClose={() => setForceLogoutUser(null)}
                onConfirm={() => forceLogoutUser !== null && executeForceLogout(forceLogoutUser.id)}
                title="ユーザーを強制ログアウトさせますか？"
                message={`対象: ${forceLogoutUser?.email || ''}\n\nこの操作により、対象のユーザーは直ちにログアウトされ、ログインページにリダイレクトされます。よろしいですか？`}
                confirmText="強制ログアウトする"
                variant="danger"
            />
        </div>
    )
}
