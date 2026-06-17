'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertOctagon, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

type ConfirmationModalProps = {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info' | 'success'
    requiredInputText?: string
    inputPlaceholder?: string
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '実行する',
    cancelText = 'キャンセル',
    variant = 'info',
    requiredInputText,
    inputPlaceholder = '確認用テキストを入力してください'
}: ConfirmationModalProps) {
    const [inputValue, setInputValue] = useState('')

    // Reset input value when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setInputValue('')
        }
    }, [isOpen])

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: <AlertOctagon className="w-8 h-8 text-rose-600" />,
                    iconBg: 'bg-rose-50',
                    confirmBtn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 text-white',
                    titleColor: 'text-rose-800'
                }
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
                    iconBg: 'bg-amber-50',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100 text-white',
                    titleColor: 'text-amber-800'
                }
            case 'success':
                return {
                    icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
                    iconBg: 'bg-emerald-50',
                    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 text-white',
                    titleColor: 'text-emerald-800'
                }
            case 'info':
            default:
                return {
                    icon: <Info className="w-8 h-8 text-indigo-600" />,
                    iconBg: 'bg-indigo-50',
                    confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 text-white',
                    titleColor: 'text-indigo-800'
                }
        }
    }

    const { icon, iconBg, confirmBtn, titleColor } = getVariantStyles()
    const isConfirmDisabled = requiredInputText ? inputValue !== requiredInputText : false

    const handleConfirm = () => {
        if (isConfirmDisabled) return
        onConfirm()
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 m-auto z-[110] max-w-md w-[92%] h-fit bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col space-y-6"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-2xl ${iconBg} shrink-0`}>
                                {icon}
                            </div>
                            <div className="space-y-2">
                                <h3 className={`text-lg font-bold font-mincho ${titleColor} leading-snug`}>
                                    {title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line font-medium">
                                    {message}
                                </p>
                            </div>
                        </div>

                        {/* Input Check for Danger operations */}
                        {requiredInputText && (
                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="block text-xs font-bold text-slate-600">
                                    確認のため、半角大文字で「<span className="text-rose-600 font-mono font-bold select-all">{requiredInputText}</span>」と入力してください。
                                </label>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="art-input w-full bg-white border border-slate-200 text-sm py-2 px-3 rounded-xl focus:border-rose-500 focus:ring-rose-200/20"
                                />
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isConfirmDisabled}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer ${confirmBtn} ${
                                    isConfirmDisabled ? 'opacity-40 cursor-not-allowed shadow-none' : ''
                                }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
