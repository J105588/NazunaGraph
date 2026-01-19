'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types'
import { Save, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfileEditor({ profile, onSaveSuccess }: { profile: Profile, onSaveSuccess?: () => void }) {
    const supabase = createClient()
    const [displayName, setDisplayName] = useState(profile.display_name || '')
    const [groupName, setGroupName] = useState(profile.group_name || '')
    const [description, setDescription] = useState(profile.description || '')
    const [imagePreview, setImagePreview] = useState<string | null>(profile.image_url)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Image Upload Logic (Adapted from ItemFormModal)

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
        setLoading(true)

        try {
            let finalImageUrl = profile.image_url

            if (imageFile) {
                const url = await uploadImage(imageFile)
                if (url) finalImageUrl = url
            }

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
            if (onSaveSuccess) onSaveSuccess()
        } catch (err) {
            console.error(err)
            toast.error('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass-card p-6 rounded-2xl mb-8">
            <h3 className="text-xl font-bold font-serif text-white mb-6">基本情報設定</h3>
            <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">展示イメージ画像</label>
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer hover:border-white/30 transition-colors">
                            {imagePreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-500 text-xs text-center p-2">No Image</div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="text-sm text-gray-400">
                            <p>クリックして画像をアップロード</p>
                            <p className="text-xs text-gray-500 mt-1">推奨: 16:9 などの横長画像</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        展示名 (メイン表示) <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="例: 伝説の焼きそば"
                        className="art-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        団体名・クラス名 (サブ表示) <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="例: 3年A組"
                        className="art-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        展示説明文 (PR)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="来場者に向けたPRメッセージを入力してください"
                        className="art-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="art-btn flex items-center gap-2 px-6 py-2 ml-auto"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    保存する
                </button>
            </form>
        </div>
    )
}
