'use client';

import React from 'react';
import { Cloud, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export function AutosaveStatus({ status = 'saved', lastSavedAt = null, className = '' }) {
    const { t, lang } = useApp();

    if (status === 'saving') {
        return (
            <div className={`flex items-center gap-1.5 text-[11px] text-primary font-medium ${className}`}>
                <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
                <span>{t("Autosaving...", "جاري الحفظ التلقائي...")}</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={`flex items-center gap-1.5 text-[11px] text-destructive font-medium ${className}`}>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{t("Save failed (Saved offline)", "تعذر الحفظ (محفوظ محلياً)")}</span>
            </div>
        );
    }

    const timeLocale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const timeStr = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <div className={`flex items-center gap-1.5 text-[11px] text-ok/90 font-medium ${className}`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
            <span>
                {lastSavedAt
                    ? (lang === 'ar' ? `تم الحفظ ${timeStr}` : `Saved at ${timeStr}`)
                    : t("Saved", "محفوظ")}
            </span>
        </div>
    );
}

export default AutosaveStatus;
