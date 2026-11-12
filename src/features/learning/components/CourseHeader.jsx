'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ArrowRight,
    Edit3,
    Plus,
    ExternalLink,
    PlayCircle,
    User,
    BookOpen,
    FileText,
    Layers,
    FolderTree,
    GraduationCap,
    Download,
    Loader2
} from 'lucide-react';
import { ShareButton } from '@/features/sharing';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';
import { downloadCoursePdfFile } from '../utils/pdfClientDownload.js';

export function CourseHeader({ course, lessonsCount = 0, materialsCount = 0 }) {
    const { t, lang } = useApp();
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    if (!course) return null;

    const handleDownloadCourseBookPdf = async () => {
        if (isDownloadingPdf) return;
        setIsDownloadingPdf(true);
        try {
            await downloadCoursePdfFile({
                courseId: course.id,
                fallbackFileName: `${(course.title || 'Course').trim()} - كل المحاضرات.pdf`
            });
        } catch (err) {
            console.error('Failed to download Course Book PDF:', err);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const totalUnits = Number(course.total_units) || 0;
    const completedUnits = Number(course.completed_units) || 0;
    const percentage = Math.round(Number(course.progress_percentage) || (totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0));

    const isYouTube = course.url && (course.url.includes('youtube.com') || course.url.includes('youtu.be'));

    const statusMap = {
        completed: {
            label: t("Completed", "مكتمل"),
            color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
        },
        in_progress: {
            label: t("In Progress", "قيد التعلّم"),
            color: 'bg-primary/10 text-primary border-primary/25'
        },
        not_started: {
            label: t("Not Started", "لم يبدأ"),
            color: 'bg-surfaceMuted text-inkMuted border-line'
        },
        paused: {
            label: t("Paused", "متوقف مؤقتاً"),
            color: 'bg-amber-500/10 text-amber-500 border-amber-500/25'
        }
    };

    const statusKey = (course.status || '').toLowerCase().replace(/\s+/g, '_');
    const statusBadge = statusMap[statusKey] || statusMap.not_started;

    return (
        <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Navigation & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-inkMuted">
                    <Link
                        href="/courses/hierarchy"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-inkSecondary hover:text-ink transition cursor-pointer font-medium"
                    >
                        {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                        <span>{t("Course Tree", "شجرة الكورسات")}</span>
                    </Link>

                    <span className="text-line">/</span>

                    <span className="font-semibold text-ink line-clamp-1 max-w-[280px]">
                        {course.title}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ShareButton
                        entityType="course"
                        entityId={course.id}
                        entityTitle={course.title}
                        variant="outline"
                        size="sm"
                    />

                    <Link href={`/courses/edit/${course.id}`}>
                        <Button variant="outline" size="default" className="cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("Edit", "تعديل")}</span>
                        </Button>
                    </Link>

                    <Link href={`/courses/${course.id}/lessons/new`}>
                        <Button size="default" className="cursor-pointer">
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("Add Lesson", "إضافة محاضرة")}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Senior Hero Presentation Card */}
            <div className="rounded-3xl border border-line bg-surface/90 backdrop-blur-sm p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                <div className="space-y-3 relative z-10">
                    {/* Meta Tags Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            <FolderTree className="w-3 h-3" />
                            <span>{course.category_path || t("General", "عام")}</span>
                        </span>

                        {course.resource_type && (
                            <span className="text-[11px] font-semibold text-inkMuted px-2.5 py-1 rounded-full bg-surfaceMuted border border-line">
                                {course.resource_type}
                            </span>
                        )}

                        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border', statusBadge.color)}>
                            {statusBadge.label}
                        </span>

                        {course.url && (
                            <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    'inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition border cursor-pointer',
                                    isYouTube
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                        : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25'
                                )}
                                title={course.url}
                            >
                                {isYouTube ? (
                                    <>
                                        <PlayCircle className="w-3.5 h-3.5 fill-red-600 text-white dark:fill-red-400 dark:text-zinc-900" />
                                        <span>{t("Watch on YouTube", "مشاهدة قائمة التشغيل")}</span>
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>{t("Open Source URL", "فتح الرابط الأصلي")}</span>
                                    </>
                                )}
                            </a>
                        )}

                        {/* Direct All Lectures Course Book PDF Download (No page navigation, native backend vector PDF) */}
                        <button
                            type="button"
                            onClick={handleDownloadCourseBookPdf}
                            disabled={isDownloadingPdf}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1 rounded-full bg-[#BC5C29] hover:bg-[#a84e20] disabled:opacity-60 text-white transition shadow-2xs cursor-pointer"
                            title={t("Download full course lectures as a single compiled PDF book", "تحميل كتاب الكورس كاملاً بصيغة PDF مباشرة")}
                        >
                            {isDownloadingPdf ? (
                                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                            ) : (
                                <Download className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>
                                {isDownloadingPdf
                                    ? t("Preparing PDF...", "جاري تجهيز ملف PDF...")
                                    : t("Course Book (PDF)", "تحميل كتاب الكورس (PDF)")}
                            </span>
                        </button>
                    </div>

                    {/* Course Title */}
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-ink tracking-tight">
                        {course.title}
                    </h1>

                    {/* Presenter / Instructor Info */}
                    {course.presenter_name && (
                        <div className="flex items-center gap-2 text-xs text-inkMuted">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                <User className="w-3.5 h-3.5" />
                            </div>
                            <span>{t("Instructor:", "المحاضر:")}</span>
                            <span className="font-bold text-ink">{course.presenter_name}</span>
                        </div>
                    )}

                    {/* Clean Formatted Description */}
                    {course.description && (
                        <div className="text-[13.5px] leading-relaxed text-inkSecondary max-w-4xl whitespace-pre-line border-t border-line/60 pt-3">
                            {(course.description || '').split('\n\n🎙️ المحاضر')[0].trim()}
                        </div>
                    )}
                </div>

                {/* Integrated Progress & Metric Footer Strip */}
                <div className="pt-4 border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs relative z-10">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11.5px]">
                            <span className="font-semibold text-inkMuted">{t("Curriculum Progress", "نسبة الإنجاز")}</span>
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
                            <span className="text-[11px] font-medium text-inkMuted block">{t("Units / Lectures", "الوحدات الدراسية")}</span>
                            <span className="text-sm font-black text-ink font-mono">{completedUnits} / {totalUnits || lessonsCount || 0}</span>
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
                            <span className="text-[11px] font-medium text-inkMuted block">{t("Materials & Attachments", "المواد والمرفقات")}</span>
                            <span className="text-sm font-black text-ink font-mono">{materialsCount} {t("Files", "ملف")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseHeader;
