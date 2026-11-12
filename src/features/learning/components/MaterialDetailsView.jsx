'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import {
    BookOpen,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    FileText,
    Layers,
    Sparkles
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import MaterialHeader from './MaterialHeader.jsx';
import CourseLessonsList from './CourseLessonsList.jsx';
import CourseMaterialsPanel from './CourseMaterialsPanel.jsx';
import LessonEditor from './LessonEditor.jsx';
import { updateCourseProgress } from '@/features/learning/api/coursesOverview.api.js';
import { fetchMaterialDetails } from '@/features/learning/api/materials.api.js';
import { fetchCourseLessons, fetchCourseAttachments } from '@/features/learning/api/lessons.api.js';

export function MaterialDetailsView({ materialId }) {
    const { t, lang, setActiveDashboard } = useApp();
    const router = useRouter();

    const [material, setMaterial] = useState(null);
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'units' | 'materials' | 'notes'
    const [updating, setUpdating] = useState(false);

    const loadAttachments = useCallback(() => {
        const id = course?.id;
        if (!id) return;
        fetchCourseAttachments(id).then(res => {
            if (res?.success && Array.isArray(res.data)) {
                setAttachments(res.data);
            }
        }).catch(err => console.error('Failed to load attachments:', err));
    }, [course]);

    useEffect(() => {
        queueMicrotask(() => setActiveDashboard('courses'));
        if (!materialId) return;
        fetchMaterialDetails(materialId)
            .then(data => {
                if (data?.material) {
                    setMaterial(data.material);
                    setCourse(data.course);

                    const linkedCourseId = data.course?.id;
                    if (linkedCourseId) {
                        return Promise.all([
                            fetchCourseLessons(linkedCourseId).then(res => {
                                if (res?.success && Array.isArray(res.data)) {
                                    setLessons(res.data);
                                }
                            }).catch(() => {}),
                            fetchCourseAttachments(linkedCourseId).then(res => {
                                if (res?.success && Array.isArray(res.data)) {
                                    setAttachments(res.data);
                                }
                            }).catch(() => {})
                        ]);
                    }
                }
            })
            .catch(err => console.error('Failed to load material details:', err))
            .finally(() => setLoading(false));
    }, [materialId, setActiveDashboard]);

    const completedUnits = Number(course?.completed_units || 0);
    const totalUnits = Number(course?.total_units || 1);

    if (loading) {
        return (
            <div className="py-24 text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                <span className="text-xs text-inkMuted font-medium">{t("Loading material workspace...", "جاري تحميل مساحة عمل المادة...")}</span>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="py-20 text-center space-y-3 max-w-xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h3 className="text-base font-bold text-ink">{t("Material Not Found", "المادة غير موجودة")}</h3>
                <p className="text-xs text-inkMuted">{t("Could not find the requested material or it might have been deleted.", "تعذر العثور على المادة المطلوبة أو قد تكون حُذفت.")}</p>
                <Link
                    href="/courses/materials"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition mt-2 cursor-pointer shadow-xs"
                >
                    {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                    <span>{t("Back to Materials Library", "العودة لمكتبة المواد")}</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 animate-fade-in pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header & Hero Presentation */}
            <MaterialHeader
                material={material}
                course={course}
                lessonsCount={lessons.length}
                materialsCount={attachments.length}
            />

            {/* Segmented Control Tabs */}
            <div className="p-1 bg-surfaceMuted/60 rounded-2xl border border-line flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setActiveTab('lessons')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap',
                        activeTab === 'lessons'
                            ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                            : 'text-inkMuted hover:text-ink'
                    )}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>{t("Lessons & Chapters", "الدروس والفصول")} ({lessons.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('units')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap',
                        activeTab === 'units'
                            ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                            : 'text-inkMuted hover:text-ink'
                    )}
                >
                    <Layers className="w-4 h-4" />
                    <span>{t("Progress & Units Map", "خريطة التقدم والوحدات")} ({completedUnits}/{totalUnits || 1})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('materials')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap',
                        activeTab === 'materials'
                            ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                            : 'text-inkMuted hover:text-ink'
                    )}
                >
                    <FileText className="w-4 h-4" />
                    <span>{t("Files & Materials", "الملفات والمرفقات")} ({attachments.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl transition cursor-pointer whitespace-nowrap',
                        activeTab === 'notes'
                            ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                            : 'text-inkMuted hover:text-ink'
                    )}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>{t("General Notes & Equations", "ملاحظات ومعادلات عامة")}</span>
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'lessons' && course && (
                <div className="pt-1">
                    <CourseLessonsList
                        lessons={lessons}
                        courseId={course.id}
                        basePath={`/courses/materials/${material.id}`}
                        totalUnits={totalUnits}
                        onLessonsUpdate={setLessons}
                    />
                </div>
            )}

            {activeTab === 'units' && course && (
                <div className="p-6 rounded-3xl border border-line bg-surface space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-ink flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                <span>{t("Curriculum Units Progress Map", "مخطط تقدم الوحدات والفصول")}</span>
                            </h3>
                            <p className="text-xs text-inkMuted">
                                {t("Click any unit to toggle between completed and in-progress.", "انقر على أي وحدة لتبديل حالتها بين مكتملة وقيد الدراسة.")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25">
                                {completedUnits} {t("of", "من")} {totalUnits} {t("completed", "مكتملة")}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                        {Array.from({ length: Math.max(totalUnits, 1) }).map((_, idx) => {
                            const unitNumber = idx + 1;
                            const isDone = unitNumber <= completedUnits;
                            return (
                                <div
                                    key={unitNumber}
                                    className={cn(
                                        'p-4 rounded-2xl border flex items-center justify-between text-xs transition cursor-pointer',
                                        isDone
                                            ? 'bg-ok/10 border-ok/30 text-ok font-bold shadow-xs'
                                            : 'bg-surfaceMuted/50 border-line text-inkMuted hover:border-lineStrong hover:text-ink'
                                    )}
                                    onClick={async () => {
                                        if (updating) return;
                                        const newCount = isDone ? unitNumber - 1 : unitNumber;
                                        setUpdating(true);
                                        try {
                                            await updateCourseProgress(course.id, newCount, totalUnits);
                                            setCourse(prev => ({
                                                ...prev,
                                                completed_units: newCount,
                                                progress_percentage: totalUnits > 0 ? (newCount / totalUnits) * 100 : 0
                                            }));
                                        } finally {
                                            setUpdating(false);
                                        }
                                    }}
                                >
                                    <span className="font-mono text-sm">{t("Unit", "الوحدة")} #{unitNumber}</span>
                                    {isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-line shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'materials' && course && (
                <div className="pt-1">
                    <CourseMaterialsPanel
                        courseId={course.id}
                        attachments={attachments}
                        lessons={lessons}
                        onRefresh={loadAttachments}
                    />
                </div>
            )}

            {activeTab === 'notes' && course && (
                <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-4">
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-ink flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>{t("Material Notes & Equations Editor", "محرر ملاحظات ومعادلات المادة")}</span>
                            </h3>
                            <p className="text-xs text-inkMuted">
                                {t("Auto-saved locally and to server with KaTeX support.", "حفظ تلقائي محلي وسحابي مع دعم KaTeX.")}
                            </p>
                        </div>
                    </div>

                    <LessonEditor
                        courseId={course.id}
                        lessonId={`material-${material.id}-notes`}
                        initialTitle={`${material.file_name} — ${t("Notes", "ملاحظات")}`}
                    />
                </div>
            )}
        </div>
    );
}

export default MaterialDetailsView;
