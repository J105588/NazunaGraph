'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Item, Profile } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

type AdminItemFormModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialItem?: Item | null
}

export default function AdminItemFormModal({ isOpen, onClose, onSuccess, initialItem }: AdminItemFormModalProps) {
    const supabase = createClient()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [ownerId, setOwnerId] = useState<string>('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [groups, setGroups] = useState<Partial<Profile>[]>([]) // Profiles with role='group'
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: groupData } = await supabase
                .from('profiles')
                .select('id, group_name, display_name, role')
                .in('role', ['group', 'admin'])
                .order('group_name')
            if (groupData) setGroups(groupData)
        }
        fetchData()
    }, [supabase])

    useEffect(() => {
        if (initialItem) {
            setName(initialItem.name)
            setDescription(initialItem.description || '')
            setOwnerId(initialItem.owner_id)
            setImagePreview(initialItem.image_url)
        } else {
            // Reset form for new item
            setName('')
            setDescription('')
            setOwnerId('')
            setImageFile(null)
            setImagePreview(null)
        }
    }, [initialItem, isOpen])

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
            // Use ownerId for the path. If no ownerId is set, fall back to the current user's UID.
            let uploadFolder = ownerId
            if (!uploadFolder) {
                const { data: { user } } = await supabase.auth.getUser()
                uploadFolder = user?.id || 'unknown'
            }
            const fileName = `${uploadFolder}/${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('item-images')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ownerId) {
            toast.error('所有者を選択してください')
            return
        }
        setLoading(true)

        try {
            let imageUrl = initialItem?.image_url || null

            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile)
                if (uploadedUrl) {
                    imageUrl = uploadedUrl
                } else {
                    setLoading(false)
                    return
                }
            }

            const itemData = {
                name,
                description,
                image_url: imageUrl,
                owner_id: ownerId,
                ...(initialItem ? {} : { status_id: 1 })
            }

            if (initialItem) {
                const { error } = await supabase
                    .from('items')
                    .update(itemData)
                    .eq('id', initialItem.id)
                if (error) throw error
                toast.success('更新しました')
            } else {
                const { error } = await supabase
                    .from('items')
                    .insert(itemData)
                if (error) throw error
                toast.success('作成しました')
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving item:', error)
            toast.error('保存に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 15 }}
                        className="fixed inset-0 m-auto z-50 max-w-lg w-[95%] h-fit max-h-[90vh] overflow-y-auto bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-800">
                                {initialItem ? '【管理者】出品情報の編集' : '【管理者】新規アイテム追加'}
                            </h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Owner Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500">所有団体/管理者 (必須)</label>
                                <select
                                    required
                                    value={ownerId}
                                    onChange={(e) => setOwnerId(e.target.value)}
                                    className="art-input w-full bg-white border border-slate-200 text-slate-800"
                                >
                                    <option value="">所有団体を選択してください</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.role === 'admin' ? '[管理者] ' : ''}
                                            {g.group_name || g.display_name || 'No Name'}
                                            {g.role === 'group' && g.display_name ? ` (${g.display_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500">商品画像</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center group cursor-pointer hover:border-indigo-300 hover:bg-slate-100/50 transition-all">
                                        {imagePreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        <p className="font-semibold text-slate-600">クリックして画像をアップロード</p>
                                        <p className="text-slate-400 mt-0.5">推奨: 4:3 または 1:1, 最大 2MB</p>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500">商品名</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="art-input w-full bg-white border border-slate-200"
                                    placeholder="例: フランクフルト"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500">説明文</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="art-input w-full bg-white border border-slate-200 resize-none rounded-xl"
                                    placeholder="商品の説明を入力してください"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="w-full art-btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                            >
                                {(loading || uploading) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        <span>保存する</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
