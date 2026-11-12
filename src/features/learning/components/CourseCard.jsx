'use client';

import { I18N_KEYS } from '@/shared/enums/index.js';

import React from 'react';
import Link from '@/shared/next-compat/link';
import { cn } from '@/shared/utils/utils.js';
import { GraduationCap, BookOpen, Clock, User, ChevronLeft, ChevronRight, Edit3, ExternalLink } from 'lucide-react';
import { ShareButton } from '@/features/sharing';
import { useApp } from '@/shared/context/AppContext.jsx';

export function CourseCard({
    course,
    className
}) {
    const { t, lang } = useApp();
    if (!course) return null;

    const progress = Number(course.progress_percentage || 0);
    const completedUnits = Number(course.completed_units || 0);
    const totalUnits = Number(course.total_units || 0);

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

    const statusBadge = statusMap[course.status] || statusMap.in_progress;

    return (
        <div
            className={cn(
                'group relative rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-card flex flex-col justify-between space-y-4',
                className
            )}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="space-y-3">
                {/* Header: Category, Status, and Share Button */}
                <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surfaceMuted text-inkSecondary border border-line truncate max-w-[150px]">
                        {course.category_path || t("General", "عام")}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {(() => {
                            const lessonsCount = Number(course.lessons_count || 0);
                            const total = Number(course.total_units || 0);
                            const isComplete = lessonsCount >= total && total > 0;
                            const isPartial = lessonsCount > 0 && !isComplete;

                            const badgeColor = isComplete
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : isPartial
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';

                            const dotColor = isComplete ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-rose-500';

                            const label = isComplete
                                ? `${lessonsCount}/${total} ${t("complete", "مكتمل")}`
                                : isPartial
                                ? `${lessonsCount}/${total} ${t("partial", "جزئي")}`
                                : `0/${total} ${t(I18N_KEYS.LEARNING_NO_LECTURES_IN_DATABASE, "فارغ")}`;

                            return (
                                <span
                                    className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', badgeColor)}
                                    title={t(I18N_KEYS.LEARNING_LECTURES_COMPLETE, "اكتمال المحاضرات في قاعدة البيانات")}
                                >
                                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
                                    <span>{label}</span>
                                </span>
                            );
                        })()}

                        <span className={cn('px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border', statusBadge.color)}>
                            {statusBadge.label}
                        </span>

                        <ShareButton
                            entityType="course"
                            entityId={course.id}
                            entityTitle={course.title}
                            variant="icon"
                            size="xs"
                        />
                    </div>
                </div>

                {/* Course Title */}
                <Link
                    href={`/courses/${course.id}`}
                    className="block group-hover:text-primary transition-colors"
                >
                    <h3 className="text-[15px] font-bold text-ink line-clamp-2 leading-snug">
                        {course.title}
                    </h3>
                </Link>

                {/* Presenter / Instructor Info */}
                {course.presenter_name && (
                    <div className="flex items-center gap-1.5 text-[12px] text-inkMuted">
                        <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{course.presenter_name}</span>
                    </div>
                )}

                {/* Description snippet if present */}
                {course.description && (
                    <p className="text-[12px] text-inkMuted line-clamp-2 leading-relaxed">
                        {course.description}
                    </p>
                )}
            </div>

            {/* Footer: Progress and Interactive Units */}
            <div className="pt-3 border-t border-line space-y-2.5">
                <div className="flex items-center justify-between text-[11.5px] text-inkMuted">
                    <span className="flex items-center gap-1.5 font-medium">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span>{completedUnits} / {totalUnits} {t("units", "وحدة")}</span>
                    </span>
                    <span className="font-bold text-ink font-mono">{Math.round(progress)}%</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-2 w-full rounded-full bg-surfaceMuted overflow-hidden border border-line/40">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>

                {/* Bottom Action Links */}
                <div className="flex items-center justify-between pt-1 text-[11.5px]">
                    <Link
                        href={`/courses/${course.id}`}
                        className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        <span>{t("Course Workspace", "محتوى الكورس")}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </Link>

                    <Link
                        href={`/courses/edit/${course.id}`}
                        className="text-inkMuted hover:text-ink flex items-center gap-1 transition cursor-pointer"
                        title={t("Edit Course", "تعديل الكورس")}
                    >
                        <Edit3 className="w-3 h-3" />
                        <span>{t("Edit", "تعديل")}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default CourseCard;
