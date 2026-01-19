'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Category, Item } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

type ItemFormModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialItem?: Item | null
    userId: string
}

export default function ItemFormModal({ isOpen, onClose, onSuccess, initialItem, userId }: ItemFormModalProps) {
    const supabase = createClient()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState<number | ''>('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('*').order('sort_order')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [supabase])

    useEffect(() => {
        if (initialItem) {
            setName(initialItem.name)
            setDescription(initialItem.description || '')
            setCategoryId(initialItem.category_id || '')
            setImagePreview(initialItem.image_url)
        } else {
            // Reset form for new item
            setName('')
            setDescription('')
            setCategoryId('')
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
            const fileName = `${userId}/${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Ensure bucket exists
            // Since we can't create bucket client-side usually, we assume 'item-images' exists.
            // Policies should allow creating objects for authenticated users.

            const { error: uploadError } = await supabase.storage
                .from('item-images')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Upload Error:', uploadError)
                throw uploadError
            }

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
        setLoading(true)

        try {
            let imageUrl = initialItem?.image_url || null

            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile)
                if (uploadedUrl) {
                    imageUrl = uploadedUrl
                } else {
                    // Upload failed but we continued? No, return.
                    setLoading(false)
                    return
                }
            }

            const itemData = {
                name,
                description,
                category_id: categoryId === '' ? null : Number(categoryId),
                image_url: imageUrl,
                owner_id: userId,
                // Set a default status if new (e.g., 1 which is usually '販売中' or '準備中' depending on seed)
                // We'll let database default or use '1' if known. Best to fetch statuses? 
                // schema doesn't default status_id. Let's assume 1 is sensible from the seed data user provided.
                // Seed: 1='販売中', 4='準備中'. Maybe '4'? 
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 m-auto z-50 max-w-lg w-[95%] h-fit max-h-[90vh] overflow-y-auto glass-card border border-white/20 p-6 md:p-8"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-serif text-white">
                                {initialItem ? 'アイテム編集' : '新規アイテム登録'}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">商品画像</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group cursor-pointer">
                                        {imagePreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors" />
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
                                        <p className="text-xs text-gray-500 mt-1">推奨: 4:3 または 1:1, 最大 2MB</p>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">商品名</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="art-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                                    placeholder="例: 焼きそば"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">説明文</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="art-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 resize-none"
                                    placeholder="商品の魅力や詳細を入力してください"
                                />
                            </div>



                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="w-full art-btn flex items-center justify-center gap-2 mt-4"
                            >
                                {(loading || uploading) ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
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
