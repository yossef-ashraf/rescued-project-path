'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
import { createPortal } from 'react-dom';
import { Trash2, X, Loader2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export default function ConfirmDeleteModal({
    isOpen,
    title,
    message,
    itemName = '',
    confirmText,
    cancelText,
    onConfirm,
    onClose,
    isDeleting = false
}) {
    const { t, lang } = useApp();
    const [internalBusy, setInternalBusy] = useState(false);
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    if (!isOpen || !mounted || typeof document === 'undefined') return null;

    const busy = Boolean(isDeleting || internalBusy);
    const isAr = lang === 'ar';
    const displayTitle = title || t('Confirm Deletion', 'تأكيد الحذف');
    const displayMessage = message || t(
        'Are you sure you want to delete this item? This action cannot be undone.',
        'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.'
    );
    const displayConfirm = confirmText || t('Confirm Delete', 'تأكيد الحذف');
    const displayCancel = cancelText || t('Cancel', 'إلغاء');
    const displaySub = t('Irreversible action', 'إجراء لا يمكن الرجوع فيه');
    const displayLoading = t('Deleting...', 'جاري الحذف...');

    const handleConfirmClick = async () => {
        if (busy) return;
        if (typeof onConfirm !== 'function') return;
        try {
            setInternalBusy(true);
            await onConfirm();
        } finally {
            setInternalBusy(false);
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(event) => event.target === event.currentTarget && !busy && onClose?.()}
            role="presentation"
        >
            <div
                className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 text-zinc-900 dark:text-white shadow-2xl animate-in zoom-in-95 duration-150"
                dir={isAr ? 'rtl' : 'ltr'}
                role="alertdialog"
                aria-modal="true"
                aria-busy={busy}
                aria-labelledby="delete-dialog-title"
                onClick={(e) => e.stopPropagation()}
            >
                {busy && <div className="md-progress-track mb-4 rounded-full" />}

                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                {busy ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-5 h-5" strokeWidth={1.75} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 id="delete-dialog-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
                                    {displayTitle}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                    {busy ? displayLoading : displaySub}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            data-custom-busy="true"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 space-y-2">
                        <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                            {displayMessage}
                        </p>
                        {itemName && (
                            <div className="text-xs font-semibold text-red-600 dark:text-red-400 bg-white/90 dark:bg-zinc-900/90 px-3.5 py-2 rounded-xl truncate border border-red-500/20">
                                &quot;{itemName}&quot;
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        data-custom-busy="true"
                        className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {displayCancel}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmClick}
                        disabled={busy}
                        data-custom-busy="true"
                        className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                    >
                        {busy ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                <span>{displayLoading}</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                                <span>{displayConfirm}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
