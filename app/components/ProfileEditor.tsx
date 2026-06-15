'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile, Category } from '@/types'
import { Save, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminUpdateUserProfile } from '@/app/actions/admin'

export default function ProfileEditor({
    profile,
    onSaveSuccess,
    isAdminMode = false,
    categories = [],
    initialRole,
    initialCategoryId
}: {
    profile: Profile
    onSaveSuccess?: () => void
    isAdminMode?: boolean
    categories?: Category[]
    initialRole?: Profile['role']
    initialCategoryId?: number | null
}) {
    const supabase = createClient()
    const [displayName, setDisplayName] = useState(profile.display_name || '')
    const [groupName, setGroupName] = useState(profile.group_name || '')
    const [description, setDescription] = useState(profile.description || '')
    const [imagePreview, setImagePreview] = useState<string | null>(profile.image_url)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Admin mode specific state
    const [role, setRole] = useState<Profile['role']>(() => initialRole || profile.role || 'group')
    const [categoryId, setCategoryId] = useState<number | null>(() =>
        initialCategoryId !== undefined ? initialCategoryId : profile.category_id
    )

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }
        getUserId()
    }, [supabase])

    const isEditable = isAdminMode || profile.role === 'admin'

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            setUploading(true)
            const fileExt = file.name.split('.').pop()
            const fileName = `profile-${profile.id}/${Math.random()}.${fileExt}`
            const filePath = fileName

            const { error: uploadError } = await supabase.storage
                .from('item-images') // Reusing item-images bucket
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('item-images').getPublicUrl(filePath)
            return data.publicUrl
        } catch (error) {
            console.error('Image upload failed', error)
            toast.error('画像のアップロードに失敗しました')
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isEditable) return
        setLoading(true)

        try {
            let finalImageUrl = profile.image_url

            if (imageFile) {
                const url = await uploadImage(imageFile)
                if (url) finalImageUrl = url
            }

            if (isAdminMode) {
                // Call server action using service role to bypass RLS and triggers check
                await adminUpdateUserProfile(profile.id, {
                    display_name: displayName,
                    group_name: groupName,
                    description: description,
                    image_url: finalImageUrl,
                    role: role,
                    category_id: categoryId
                })
                toast.success('ユーザー情報およびプロフィールを更新しました')
            } else {
                // Call standard client update
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        display_name: displayName,
                        group_name: groupName,
                        description: description,
                        image_url: finalImageUrl
                    })
                    .eq('id', profile.id)

                if (error) throw error
                toast.success('プロフィールを更新しました')
            }

            if (onSaveSuccess) onSaveSuccess()
        } catch (err) {
            console.error(err)
            toast.error('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <form onSubmit={handleSave} className="space-y-5 max-w-xl">
            {/* Admin Mode Specific Role & Category Configuration */}
            {isAdminMode && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">システム権限・カテゴリ設定</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">
                                システム権限
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Profile['role'])}
                                disabled={profile.id === currentUserId}
                                className="art-input w-full bg-white border border-slate-200 text-slate-800 text-xs py-2 px-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value="group">Group (団体管理者/自社編集のみ)</option>
                                <option value="admin">Admin (システム管理者/全権限)</option>
                            </select>
                            {profile.id === currentUserId && (
                                <p className="text-[9px] text-amber-600 font-bold mt-1">
                                    ※自身のアカウントの権限は変更できません
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">
                                所属カテゴリ
                            </label>
                            <select
                                value={categoryId || ''}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                                className="art-input w-full bg-white border border-slate-200 text-slate-800 text-xs py-2 px-3"
                            >
                                <option value="">未割当</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Upload */}
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">展示イメージ画像</label>
                <div className="flex items-center gap-4">
                    <div className={`relative w-32 h-20 rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center group ${isEditable ? 'cursor-pointer hover:border-indigo-300 hover:bg-slate-100/50' : 'cursor-not-allowed'} transition-all`}>
                        {imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                        {isEditable && (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        )}
                    </div>
                    <div className="text-xs text-slate-400">
                        <p className="font-semibold text-slate-600">{isEditable ? 'クリックしてイメージ画像をアップロード' : 'イメージ画像（編集不可）'}</p>
                        <p className="text-slate-400 mt-0.5">推奨: 16:9 横長画像, 最大 2MB</p>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">
                    展示名 (メイン表示) <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    required
                    value={displayName}
                    disabled={!isEditable}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="例: 焼きそば専門店"
                    className="art-input w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-slate-800"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">
                    団体名・クラス名 (サブ表示) <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    required
                    value={groupName}
                    disabled={!isEditable}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="例: 3年B組"
                    className="art-input w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-slate-800"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500">
                    展示説明文 (PRメッセージ)
                </label>
                <textarea
                    value={description}
                    disabled={!isEditable}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="来場者にアピールしたい内容を入力してください（メニューの説明や待ち時間など）"
                    className="art-input w-full bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-indigo-500 resize-none rounded-xl transition-all disabled:bg-slate-100/80 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-slate-800"
                />
            </div>

            {isEditable ? (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="art-btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        <span>変更を保存</span>
                    </button>
                </div>
            ) : (
                <div className="pt-4 border-t border-slate-200 text-slate-400 text-xs font-semibold flex items-center gap-1.5 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/80">
                    <span>※店舗情報はシステム管理者のみ編集可能です。変更を希望する場合は管理者までお問い合わせください。</span>
                </div>
            )}
        </form>
    )

    if (isAdminMode) {
        return formContent
    }

    return (
        <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">基本プロフィール設定</h3>
            {formContent}
        </div>
    )
}
