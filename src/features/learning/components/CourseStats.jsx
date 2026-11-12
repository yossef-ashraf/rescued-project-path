'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

export function CourseStats({ course, lessonsCount = 0, materialsCount = 0 }) {
    const { t, lang } = useApp();
    if (!course) return null;

    const totalUnits = Number(course.total_units) || 0;
    const completedUnits = Number(course.completed_units) || 0;
    const percentage = Math.round(Number(course.progress_percentage) || (totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0));

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Card className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-inkMuted">{t("Progress Rate", "نسبة التقدم")}</span>
                <div className="space-y-1.5 mt-1">
                    <span className="text-xl font-black text-primary">{percentage}%</span>
                    <div className="w-full h-1.5 bg-surfaceMuted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-inkMuted">{t("Units / Lectures", "الوحدات / المحاضرات")}</span>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-ink">{completedUnits}</span>
                    <span className="text-xs text-inkMuted">/ {totalUnits || lessonsCount || 0}</span>
                </div>
            </Card>

            <Card className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-inkMuted">{t("Documented Lessons", "المحاضرات الموثقة")}</span>
                <div className="flex items-center gap-1.5 mt-1">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-xl font-black text-ink">{lessonsCount}</span>
                </div>
            </Card>

            <Card className="p-3.5 rounded-xl border border-line bg-surface flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-inkMuted">{t("Materials & Files", "المواد والملفات")}</span>
                <div className="flex items-center gap-1.5 mt-1">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xl font-black text-ink">{materialsCount}</span>
                </div>
            </Card>
        </div>
    );
}

export default CourseStats;
