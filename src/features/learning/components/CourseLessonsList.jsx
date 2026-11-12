'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Sparkles, Search, CheckCircle2, Clock } from 'lucide-react';
import LessonCard from './LessonCard.jsx';
import LearningEmptyState from './LearningEmptyState.jsx';
import { createLesson, deleteLesson } from '../api/lessons.api.js';
import { useApp } from '@/shared/context/AppContext.jsx';

export function CourseLessonsList({ lessons = [], courseId, totalUnits = 0, onLessonsUpdate, basePath = null }) {
    const { t, lang } = useApp();
    const effectiveBasePath = basePath || `/courses/${courseId}`;
    const [generating, setGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'completed' | 'draft'
    const [deletingId, setDeletingId] = useState(null);

    const handleGenerateFromUnits = async () => {
        if (!courseId || totalUnits <= 0 || generating) return;
        setGenerating(true);
        try {
            const created = [];
            for (let i = 1; i <= Math.min(totalUnits, 30); i++) {
                const res = await createLesson(courseId, {
                    lesson_number: i,
                    title: lang === 'ar' ? `المحاضرة #${i}` : `Lesson #${i}`,
                    description: lang === 'ar' ? `المحاضرة والوحدة الدراسية رقم ${i} من الكورس.` : `Lesson and curriculum unit #${i} of the course.`,
                    duration_minutes: 45,
                    status: 'draft'
                });
                if (res?.success && res.data) {
                    created.push(res.data);
                }
            }
            if (onLessonsUpdate && created.length > 0) {
                onLessonsUpdate(prev => [...prev, ...created]);
            }
        } catch (err) {
            console.error('Failed to generate lessons:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!lessonId || deletingId) return;
        const confirmMsg = t(
            "Are you sure you want to delete this lesson? This action cannot be undone.",
            "هل أنت متأكد من حذف هذه المحاضرة نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        );
        if (!window.confirm(confirmMsg)) return;

        setDeletingId(lessonId);
        try {
            const res = await deleteLesson(lessonId);
            if (res?.success || res?.ok || res?.deleted) {
                if (onLessonsUpdate) {
                    onLessonsUpdate(prev => prev.filter(l => l.id !== lessonId));
                }
            } else {
                alert(res?.error || t("Failed to delete lesson", "فشل حذف المحاضرة"));
            }
        } catch (err) {
            console.error('Error deleting lesson:', err);
            alert(t("An unexpected error occurred while deleting the lesson", "حدث خطأ غير متوقع أثناء حذف المحاضرة"));
        } finally {
            setDeletingId(null);
        }
    };

    const filteredLessons = lessons.filter(lesson => {
        const matchesSearch = !searchQuery ||
            lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const isDone = lesson.status === 'completed' || Number(lesson.progress_percentage) >= 100;
        const matchesStatus = filterStatus === 'ALL' ||
            (filterStatus === 'completed' && isDone) ||
            (filterStatus === 'draft' && !isDone);
        return matchesSearch && matchesStatus;
    });

    if (!lessons || lessons.length === 0) {
        return (
            <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span>{t("Course Lessons & Lectures", "محاضرات ودروس الكورس")}</span>
                        </h3>
                        <p className="text-xs text-inkMuted">
                            {t("Document curriculum content, write lecture notes & summaries, and solve math equations.", "توثيق المحتوى، كتابة الملاحظات والملخصات، وحل المعادلات الرياضية لكل محاضرة.")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {totalUnits > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateFromUnits}
                                disabled={generating}
                                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{generating ? t("Generating...", "جاري التوليد...") : `${t("Auto-Generate", "توليد")} ${totalUnits} ${t("Lessons", "محاضرة")}`}</span>
                            </Button>
                        )}
                        <Link href={`${effectiveBasePath}/lessons/new`}>
                            <Button size="sm" className="gap-1.5 text-xs font-semibold cursor-pointer">
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t("Add First Lesson", "إضافة أول محاضرة")}</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <LearningEmptyState
                    title={t("No lessons documented for this course yet", "لم يتم توثيق أي محاضرات لهذا الكورس بعد")}
                    description={
                        totalUnits > 0
                            ? (lang === 'ar' 
                                ? `يتضمن هذا الكورس ${totalUnits} وحدة دراسية. يمكنك توليد بطاقات المحاضرات بضغطة زر أو إنشاء أول محاضرة يدوياً.`
                                : `This course includes ${totalUnits} curriculum units. You can auto-generate lesson cards with one click or create your first lesson manually.`)
                            : t("Start by adding your first lecture to document content, notes, and equations.", "ابدأ بإضافة أول محاضرة لتوثيق محتوى الكورس وكتابة الملاحظات والملخصات والمعادلات.")
                    }
                    icon={BookOpen}
                    actionLabel={totalUnits > 0 ? `${t("Generate", "توليد")} ${totalUnits} ${t("Lessons Now", "محاضرة الآن")}` : t("Add First Lesson", "إضافة أول محاضرة")}
                    onAction={totalUnits > 0 ? handleGenerateFromUnits : () => window.location.href = `${effectiveBasePath}/lessons/new`}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-ink">{t("Course Lessons & Lectures", "محاضرات ودروس الكورس")}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {lessons.length} {t("Lessons", "محاضرة")}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`${effectiveBasePath}/lessons/new`}>
                        <Button size="sm" className="gap-1.5 text-xs font-semibold cursor-pointer">
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t("Add New Lesson", "إضافة محاضرة جديدة")}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-line">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute right-3 rtl:right-3 rtl:left-auto left-auto rtl:translate-x-0 top-1/2 -translate-y-1/2 text-inkMuted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("Search by lesson title or summary...", "ابحث في عنوان أو وصف المحاضرة...")}
                        className="w-full text-xs bg-canvas border border-line rounded-lg px-8 py-1.5 text-ink focus:outline-none focus:border-primary"
                    />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <button
                        type="button"
                        onClick={() => setFilterStatus('ALL')}
                        className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            filterStatus === 'ALL'
                                ? 'bg-primary/10 border-primary text-primary font-bold'
                                : 'border-line text-inkMuted hover:text-ink'
                        }`}
                    >
                        {t("All", "الكل")} ({lessons.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus('completed')}
                        className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            filterStatus === 'completed'
                                ? 'bg-ok/10 border-ok text-ok font-bold'
                                : 'border-line text-inkMuted hover:text-ink'
                        }`}
                    >
                        {t("Completed", "مكتملة")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterStatus('draft')}
                        className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            filterStatus === 'draft'
                                ? 'bg-warn/10 border-warn text-warn font-bold'
                                : 'border-line text-inkMuted hover:text-ink'
                        }`}
                    >
                        {t("In Progress / Draft", "قيد الدراسة / مسودة")}
                    </button>
                </div>
            </div>

            {/* Grid of Lesson Cards */}
            {filteredLessons.length === 0 ? (
                <div className="py-8 text-center text-xs text-inkMuted border border-dashed border-line rounded-xl">
                    {t("No lessons match the current filters.", "لا توجد محاضرات تطابق معايير البحث الحالية.")}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredLessons.map(lesson => (
                        <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            courseId={courseId}
                            basePath={effectiveBasePath}
                            onDelete={handleDeleteLesson}
                            isDeleting={deletingId === lesson.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CourseLessonsList;
