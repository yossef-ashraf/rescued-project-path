'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { useApp } from '@/shared/context/AppContext.js';
import ShareDialog from './ShareDialog.jsx';

export function ShareButton({
    entityType = 'page',
    entityId = 0,
    entityTitle = '',
    label = null,
    variant = 'outline', // 'outline' | 'ghost' | 'icon' | 'primary'
    size = 'sm', // 'xs' | 'sm' | 'md'
    className = ''
}) {
    const { t } = useApp();
    const [isOpen, setIsOpen] = useState(false);

    const resolvedLabel = label || t('Share', 'مشاركة');

    const baseStyles = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition cursor-pointer select-none';

    const sizeStyles = {
        xs: 'h-6 px-2 text-[11px]',
        sm: 'h-7 px-2.5 text-[12px]',
        md: 'h-8 px-3 text-[13px]'
    }[size] || 'h-7 px-2.5 text-[12px]';

    const variantStyles = {
        outline: 'border border-line bg-surface hover:bg-surfaceMuted text-inkSecondary hover:text-ink shadow-xs',
        ghost: 'text-inkMuted hover:text-ink hover:bg-surfaceMuted',
        primary: 'bg-primary text-on-primary hover:opacity-90 shadow-card font-semibold',
        icon: 'w-7 h-7 p-0 rounded-lg text-inkMuted hover:text-ink hover:bg-surfaceMuted'
    }[variant] || 'border border-line bg-surface hover:bg-surfaceMuted text-inkSecondary hover:text-ink';

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(true);
                }}
                className={cn(baseStyles, sizeStyles, variantStyles, className)}
                title={t('Share this content via a temporary link', 'مشاركة هذا المحتوى برابط مؤقت')}
                aria-label={t('Share', 'مشاركة')}
            >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                {variant !== 'icon' && <span>{resolvedLabel}</span>}
            </button>

            {isOpen && (
                <ShareDialog
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    entityType={entityType}
                    entityId={entityId}
                    entityTitle={entityTitle}
                />
            )}
        </>
    );
}

export default ShareButton;
