'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/shared/context/AppContext.jsx';

export function LearningEmptyState({
    title = null,
    description = null,
    icon: Icon = BookOpen,
    actionLabel,
    onAction,
    className = ''
}) {
    const { t, lang } = useApp();

    const displayTitle = title || t("No data available currently", "لا توجد بيانات حالياً");
    const displayDesc = description || t("No items found matching the current search or filter criteria.", "لم يتم العثور على أي عناصر تطابق معايير البحث أو التصفية الحالية.");

    return (
        <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-line bg-surface/50 ${className}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-ink mb-1">{displayTitle}</h3>
            <p className="text-[12px] text-inkMuted max-w-sm mb-4 leading-relaxed">{displayDesc}</p>
            {actionLabel && onAction && (
                <Button size="sm" onClick={onAction} className="text-xs font-semibold gap-1.5 cursor-pointer">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default LearningEmptyState;
