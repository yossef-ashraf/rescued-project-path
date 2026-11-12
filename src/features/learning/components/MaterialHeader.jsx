'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ArrowRight,
    Edit3,
    Plus,
    ExternalLink,
    PlayCircle,
    BookOpen,
    FileText,
    Layers,
    FolderTree,
    Tag,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { ShareButton } from '@/features/sharing';
import { useApp } from '@/shared/context/AppContext.js';
import { cn } from '@/shared/utils/utils.js';

export function MaterialHeader({
    material,
    course,
    lessonsCount = 0,
    materialsCount = 0,
    onStatusToggle = null
}) {
    const { t, lang } = useApp();
    if (!material) return null;

    const totalUnits = Number(course?.total_units || 1);
    const completedUnits = Number(course?.completed_units || 0);
    const percentage = Math.round(
        Number(course?.progress_percentage) || (totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0)
    );

    const isYouTube = material.file_url && (material.file_url.includes('youtube.com') || material.file_url.includes('youtu.be'));

    const rawStatus = (material.reading_status || course?.status || 'unread').toLowerCase().trim();
    const isDone = rawStatus === 'completed' || rawStatus === 'read' || percentage >= 100;
    const isInProgress = rawStatus === 'reading' || rawStatus === 'in_progress' || (completedUnits > 0 && !isDone);

    const statusBadge = isDone
        ? { label: t("Completed", "مكتمل"), color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' }
        : isInProgress
        ? { label: t("In Progress", "قيد القراءة والتعلّم"), color: 'bg-primary/10 text-primary border-primary/25' }
        : { label: t("Unread", "غير مقروء"), color: 'bg-surfaceMuted text-inkMuted border-line' };

    return (
        <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Navigation & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-inkMuted">
                    <Link
                        href="/courses/materials"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-inkSecondary hover:text-ink transition cursor-pointer font-medium"
                    >
                        {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                        <span>{t("Materials Library", "مكتبة المواد المعرفية")}</span>
                    </Link>

                    <span className="text-line">/</span>

                    <span className="font-semibold text-ink line-clamp-1 max-w-[280px]">
                        {material.file_name}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ShareButton
                        entityType="material"
                        entityId={material.id}
                        entityTitle={material.file_name}
                        variant="outline"
                        size="sm"
                    />

                    {material.file_url && (
                        <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl cursor-pointer">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{t("Open Source", "فتح المصدر")}</span>
                            </Button>
                        </a>
                    )}

                    <Link href={`/courses/materials/${material.id}/lessons/new`}>
                        <Button size="sm" className="gap-1.5 text-xs font-bold rounded-xl cursor-pointer bg-primary text-on-primary hover:opacity-90 shadow-2xs">
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t("Add Lesson", "إضافة محاضرة")}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Hero Presentation Card */}
            <div className="rounded-3xl border border-line bg-surface/90 backdrop-blur-sm p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="space-y-3 relative z-10">
                    {/* Meta Tags Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <FolderTree className="w-3 h-3" />
                            <span>{material.category_name || t("General", "عام")}</span>
                        </span>

                        {material.item_type && (
                            <span className="text-[11px] font-semibold text-inkMuted px-2.5 py-1 rounded-full bg-surfaceMuted border border-line uppercase">
                                {material.item_type}
                            </span>
                        )}

                        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', statusBadge.color)}>
                            {statusBadge.label}
                        </span>

                        {material.tags && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-inkMuted px-2.5 py-1 rounded-full bg-surfaceMuted border border-line">
                                <Tag className="w-3 h-3 text-primary" />
                                <span>{material.tags}</span>
                            </span>
                        )}

                        {material.file_url && (
                            <a
                                href={material.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition border cursor-pointer',
                                    isYouTube
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                        : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25'
                                )}
                                title={material.file_url}
                            >
                                {isYouTube ? (
                                    <>
                                        <PlayCircle className="w-3.5 h-3.5 fill-red-600 text-white dark:fill-red-400 dark:text-zinc-900" />
                                        <span>{t("Watch on YouTube", "مشاهدة على يوتيوب")}</span>
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>{t("Open Source URL", "فتح الرابط الأصلي")}</span>
                                    </>
                                )}
                            </a>
                        )}
                    </div>

                    {/* Material Title */}
                    <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-snug">
                        {material.file_name}
                    </h1>

                    {/* Clean Formatted Description */}
                    {material.description && (
                        <div className="text-[13.5px] leading-relaxed text-inkSecondary max-w-4xl whitespace-pre-line border-t border-line/60 pt-3">
                            {material.description}
                        </div>
                    )}
                </div>

                {/* Integrated Progress & Metric Footer Strip */}
                <div className="pt-4 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs relative z-10">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11.5px]">
                            <span className="font-semibold text-inkMuted">{t("Material Progress", "نسبة الإنجاز")}</span>
                            <span className="font-mono font-bold text-primary">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-surfaceMuted rounded-full overflow-hidden border border-line/40">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[11px] font-medium text-inkMuted block">{t("Units / Chapters", "الوحدات والفصول")}</span>
                            <span className="text-sm font-black text-ink font-mono">{completedUnits} / {totalUnits || lessonsCount || 1}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[11px] font-medium text-inkMuted block">{t("Documented Lessons", "المحاضرات الموثقة")}</span>
                            <span className="text-sm font-black text-ink font-mono">{lessonsCount} {t("Lessons", "محاضرة")}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[11px] font-medium text-inkMuted block">{t("Files & Materials", "الملفات والمرفقات")}</span>
                            <span className="text-sm font-black text-ink font-mono">{materialsCount} {t("Files", "ملف")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MaterialHeader;
