'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';

const emptySubscribe = () => () => {};

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md', // sm, md, lg, xl, full
    className,
    showClose = true
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

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] h-[90vh]'
    }[size] || 'max-w-lg';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div
                className={cn(
                    'relative w-full rounded-xl border border-line bg-surface text-ink shadow-2xl transition-all',
                    'flex flex-col max-h-[90vh]',
                    sizeClasses,
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
                        <div>
                            {title && (
                                <h3 className="text-[15px] font-semibold text-ink leading-tight">
                                    {title}
                                </h3>
                            )}
                            {description && (
                                <p className="mt-0.5 text-[12px] text-inkMuted leading-normal">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-inkMuted hover:bg-white/5 hover:text-ink transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-2.5 border-t border-line px-5 py-3.5 bg-surfaceMuted/40 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default Modal;
