'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';

const emptySubscribe = () => () => {};

export function Sheet({
    isOpen,
    onClose,
    title,
    children,
    side = 'bottom', // 'bottom' (mobile drawer) | 'right' | 'left'
    className
}) {
    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isMounted || !isOpen || typeof document === 'undefined') return null;

    const sideClasses = {
        bottom: 'inset-x-0 bottom-0 rounded-t-2xl border-t max-h-[85vh]',
        right: 'inset-y-0 right-0 w-full max-w-md border-s h-full',
        left: 'inset-y-0 left-0 w-full max-w-md border-e h-full'
    }[side] || 'inset-x-0 bottom-0 rounded-t-2xl border-t max-h-[85vh]';

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={cn(
                    'fixed bg-surface text-ink border-line shadow-2xl flex flex-col transition-transform',
                    sideClasses,
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Drag handle for bottom sheet */}
                {side === 'bottom' && (
                    <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 shrink-0" />
                )}

                {/* Header */}
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5 shrink-0">
                    <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-inkMuted hover:bg-white/5 hover:text-ink transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">{children}</div>
            </div>
        </div>,
        document.body
    );
}

export default Sheet;
