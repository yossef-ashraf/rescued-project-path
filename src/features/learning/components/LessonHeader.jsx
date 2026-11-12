'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, Save, Trash2, Globe, ExternalLink, PlayCircle, Printer, Download, Loader2 } from 'lucide-react';
import AutosaveStatus from './AutosaveStatus.jsx';
import { ShareButton } from '@/features/sharing';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';
import { downloadCoursePdfFile } from '../utils/pdfClientDownload.js';

export function LessonHeader({
    courseId,
    courseTitle = null,
    lesson,
    autosaveStatus = 'saved',
    lastSavedAt = null,
    onManualSave,
    isSaving = false,
    onDeleteLesson = null,
    isDeleting = false,
    prevLessonId = null,
    nextLessonId = null,
    backUrl = null,
    basePath = null
}) {
    const { t, lang } = useApp();
    const [downloadingMode, setDownloadingMode] = useState(null); // 'single' | 'all' | null
    const effectiveTitle = courseTitle || t("Course", "الكورس");
    const effectiveBackUrl = backUrl || `/courses/${courseId}`;
    const effectiveBasePath = basePath || `/courses/${courseId}`;

    const handleDownloadLecturePdf = async () => {
        if (downloadingMode || !courseId || !lesson?.id) return;
        setDownloadingMode('single');
        try {
            await downloadCoursePdfFile({
                courseId,
                lessonId: lesson.id,
                fallbackFileName: `${effectiveTitle} - محاضرة ${lesson.lesson_number || 1}.pdf`
            });
        } catch (err) {
            console.error('Failed to download single lecture PDF:', err);
        } finally {
            setDownloadingMode(null);
        }
    };

    const handleDownloadAllCoursePdf = async () => {
        if (downloadingMode || !courseId) return;
        setDownloadingMode('all');
        try {
            await downloadCoursePdfFile({
                courseId,
                fallbackFileName: `${effectiveTitle} - كل المحاضرات.pdf`
            });
        } catch (err) {
            console.error('Failed to download full course PDF:', err);
        } finally {
            setDownloadingMode(null);
        }
    };

    return (
        <div className="border-b border-line py-3 px-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-center justify-between gap-2">

                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-1.5 text-xs text-muted min-w-0">
                    <Link href={effectiveBackUrl}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 px-2.5 text-[12px] text-muted hover:text-ink cursor-pointer rounded-lg border border-transparent hover:border-line"
                        >
                            {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowLeft className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate max-w-[180px] sm:max-w-[280px] font-medium">{effectiveTitle}</span>
                        </Button>
                    </Link>
                    <span className="text-muted/40 select-none">/</span>
                    <span className="font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 shrink-0 text-[12px]">
                        {lesson?.lesson_number
                            ? `${t("Lecture", "المحاضرة")} #${lesson.lesson_number}`
                            : t("New Lesson", "محاضرة جديدة")}
                    </span>
                </div>

                {/* ── Actions ── */}
                <div className="flex flex-wrap items-center gap-1.5">

                    {/* YouTube source link */}
                    {lesson?.source_url && (
                        <a
                            href={lesson.source_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-rose-500/10 hover:bg-rose-500/18 text-rose-500 border border-rose-500/25 text-[13px] font-medium transition cursor-pointer"
                            title={t("Watch original video on YouTube", "مشاهدة المحاضرة الأصلية على يوتيوب")}
                        >
                            <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">{t("YouTube", "يوتيوب")}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                    )}

                    {/* Autosave / draft status */}
                    {lesson?.id ? (
                        <AutosaveStatus status={autosaveStatus} lastSavedAt={lastSavedAt} />
                    ) : (
                        <span className="text-[11px] text-muted bg-matte px-2.5 py-1 rounded-md border border-line font-medium">
                            {t("Unsaved Draft", "مسودة جديدة")}
                        </span>
                    )}

                    {/* Share */}
                    {lesson?.id && (
                        <ShareButton
                            entityType="lesson"
                            entityId={lesson.id}
                            entityTitle={lesson.title}
                            size="sm"
                        />
                    )}

                    {/* PDF Export: single lecture + full course */}
                    {lesson?.id && (
                        <>
                            <Button
                                variant="default"
                                size="default"
                                onClick={handleDownloadLecturePdf}
                                disabled={Boolean(downloadingMode)}
                                className="cursor-pointer"
                                title={t("Download this lecture directly as a PDF file", "تحميل هذه المحاضرة مباشرة كملف PDF")}
                            >
                                {downloadingMode === 'single'
                                    ? <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                                    : <Download className="w-3.5 h-3.5 shrink-0" />}
                                <span className="hidden md:inline">
                                    {downloadingMode === 'single'
                                        ? t("Preparing...", "جاري التجهيز...")
                                        : t("Download PDF", "تحميل PDF")}
                                </span>
                            </Button>

                            <Button
                                variant="secondary"
                                size="default"
                                onClick={handleDownloadAllCoursePdf}
                                disabled={Boolean(downloadingMode)}
                                className="cursor-pointer"
                                title={t("Download all course lectures compiled as a single PDF book", "تنزيل كل محاضرات الكورس في كتاب PDF موحد مباشرة")}
                            >
                                {downloadingMode === 'all'
                                    ? <Loader2 className="w-3.5 h-3.5 text-primary shrink-0 animate-spin" />
                                    : <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />}
                                <span className="hidden md:inline">
                                    {downloadingMode === 'all'
                                        ? t("Compiling...", "جاري التجميع...")
                                        : t("All Lectures PDF", "كل المحاضرات PDF")}
                                </span>
                            </Button>
                        </>
                    )}

                    {/* Delete */}
                    {lesson?.id && onDeleteLesson && (
                        <Button
                            size="default"
                            variant="outline"
                            onClick={onDeleteLesson}
                            disabled={isDeleting}
                            className="gap-1.5 text-crit border-crit/20 hover:bg-crit/5 cursor-pointer"
                            title={t("Delete Lesson", "حذف المحاضرة")}
                        >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">
                                {isDeleting ? t("Deleting...", "جاري الحذف...") : t("Delete", "حذف")}
                            </span>
                        </Button>
                    )}

                    {/* Save */}
                    {onManualSave && (
                        <Button
                            size="default"
                            onClick={onManualSave}
                            disabled={isSaving}
                            className="gap-1.5 cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5 shrink-0" />
                            <span>{isSaving ? t("Saving...", "جاري الحفظ...") : t("Save", "حفظ")}</span>
                        </Button>
                    )}

                    {/* Prev / Next navigation */}
                    {lesson?.id && (prevLessonId || nextLessonId) && (
                        <div className="flex items-center border border-line rounded-md overflow-hidden bg-matte/50">
                            {prevLessonId && (
                                <Link href={`${effectiveBasePath}/lessons/${prevLessonId}`}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-none cursor-pointer"
                                        title={t("Previous Lesson", "المحاضرة السابقة")}
                                    >
                                        {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </Button>
                                </Link>
                            )}
                            {prevLessonId && nextLessonId && (
                                <span className="w-px h-5 bg-line shrink-0" />
                            )}
                            {nextLessonId && (
                                <Link href={`${effectiveBasePath}/lessons/${nextLessonId}`}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-none cursor-pointer"
                                        title={t("Next Lesson", "المحاضرة التالية")}
                                    >
                                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default LessonHeader;
