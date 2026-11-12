'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Share2, Trash2 } from 'lucide-react';
import { ShareButton } from '@/features/sharing';
import { useApp } from '@/shared/context/AppContext.jsx';

export function LessonCard({ lesson, courseId, basePath = null, onDelete, isDeleting = false }) {
    const { t, lang } = useApp();
    if (!lesson) return null;

    const isCompleted = lesson.status === 'completed' || Number(lesson.progress_percentage) >= 100;
    const lessonHref = `${basePath || `/courses/${courseId}`}/lessons/${lesson.id}`;

    return (
        <div
            className="p-5 rounded-2xl border border-line bg-surface hover:border-primary/50 hover:shadow-card transition-all flex flex-col justify-between gap-3 group relative select-none"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {lesson.lesson_number || '#'}
                        </span>
                        <Link href={lessonHref} className="block group-hover:text-primary transition-colors min-w-0 flex-1" title={lesson.title}>
                            <h4 className="text-sm font-bold text-ink line-clamp-1 break-words">
                                {lesson.title}
                            </h4>
                        </Link>
                    </div>

                    {isCompleted ? (
                        <span className="flex items-center gap-1 text-[10.5px] text-ok bg-ok/10 border border-ok/25 px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t("Completed", "مكتمل")}</span>
                        </span>
                    ) : (
                        <span className="text-[10.5px] text-inkMuted bg-surfaceMuted px-2.5 py-0.5 rounded-full border border-line shrink-0 font-medium">
                            {lesson.status === 'draft' ? t("Draft", "مسودة") : (lesson.status || t("In Progress", "قيد التقدم"))}
                        </span>
                    )}
                </div>

                {lesson.description && (
                    <p className="text-[12.5px] text-inkMuted line-clamp-2 leading-relaxed">
                        {lesson.description}
                    </p>
                )}
            </div>

            <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-inkMuted">
                <div className="flex items-center gap-3">
                    {lesson.duration_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-inkMuted" />
                            <span>{lesson.duration_minutes} {t("mins", "دقيقة")}</span>
                        </span>
                    )}
                    {lesson.lecture_date && (
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-inkMuted" />
                            <span>{lesson.lecture_date}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onDelete(lesson.id);
                            }}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                            title={t("Delete Lesson", "حذف المحاضرة")}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <ShareButton
                        entityType="lesson"
                        entityId={lesson.id}
                        entityTitle={lesson.title}
                        variant="icon"
                        size="xs"
                        className="text-inkMuted hover:text-ink cursor-pointer"
                    />

                    <Link
                        href={lessonHref}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                    >
                        <span>{t("Open", "فتح")}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LessonCard;
