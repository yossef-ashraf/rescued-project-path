'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { useApp } from '@/shared/context/AppContext.js';

export const DURATION_OPTIONS = [
    { value: '5m', labelEn: '5 minutes', labelAr: '5 دقائق', descEn: 'Fast instant preview', descAr: 'للمعاينة الفورية السريعة' },
    { value: '15m', labelEn: '15 minutes', labelAr: '15 دقيقة', descEn: 'Quick client or colleague review', descAr: 'لمراجعة سريعة مع عميل أو زميل' },
    { value: '1h', labelEn: '1 hour', labelAr: 'ساعة واحدة', descEn: 'Standard safe duration', descAr: 'المدة القياسية الآمنة' },
    { value: '24h', labelEn: '24 hours', labelAr: '24 ساعة', descEn: 'Full 1-day access', descAr: 'صلاحية ليوم كامل' },
    { value: '7d', labelEn: '7 days', labelAr: '7 أيام', descEn: 'Extended 1-week validity', descAr: 'صلاحية ممتدة لأسبوع' }
];

export function ShareDurationSelect({ value = '1h', onChange }) {
    const { t, lang } = useApp();

    return (
        <div className="space-y-2">
            <label className="text-[12px] font-semibold text-ink flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{t('Expiration Duration', 'مدة الصلاحية')}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={cn(
                                'flex flex-col items-start p-2.5 rounded-lg border text-start transition-all cursor-pointer',
                                isSelected
                                    ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/30'
                                    : 'bg-surface hover:bg-surfaceMuted border-line text-inkSecondary hover:text-ink'
                            )}
                        >
                            <span className="text-[12.5px] font-bold">
                                {lang === 'ar' ? opt.labelAr : opt.labelEn}
                            </span>
                            <span className="text-[10px] text-inkMuted line-clamp-1">
                                {lang === 'ar' ? opt.descAr : opt.descEn}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ShareDurationSelect;
