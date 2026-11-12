'use client';

import React from 'react';
import { Lock, StickyNote } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

export function LessonNotesEditor({ notes, onChange }) {
    const { t, lang } = useApp();

    return (
        <div className="space-y-1.5 p-3.5 bg-surface rounded-xl border border-line" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <StickyNote className="w-3.5 h-3.5 text-warn" />
                    <span>{t("Private Notes", "ملاحظات خاصة")}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-warn bg-warn/10 px-2 py-0.5 rounded-full font-medium">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{t("Private • Hidden when shared", "خاصة ولن تظهر في المشاركة")}</span>
                </div>
            </div>
            <textarea
                value={notes || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t("Personal thoughts, questions, or notes hidden during share...", "أفكار أو استفسارات أو ملاحظات شخصية لا تريد ظهورها عند مشاركة المحاضرة...")}
                rows={3}
                className="w-full text-xs bg-canvas border border-line rounded-lg p-2.5 text-ink leading-relaxed placeholder:text-inkMuted/60 focus:outline-none focus:border-warn transition-colors resize-y"
            />
        </div>
    );
}

export default LessonNotesEditor;
