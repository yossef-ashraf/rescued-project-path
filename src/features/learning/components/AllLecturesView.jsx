'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import {
    PlayCircle,
    Search,
    BookOpen,
    Clock,
    FileText,
    ExternalLink,
    Download,
    LayoutGrid,
    Table as TableIcon,
    ArrowUpRight,
    Sparkles,
    CheckCircle2,
    X,
    Filter,
    Layers,
    GraduationCap,
    Printer,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { fetchAllLessons } from '@/features/learning/api/lessons.api.js';
import { downloadCoursePdfFile } from '../utils/pdfClientDownload.js';

export default function AllLecturesView() {
    const router = useRouter();
    const { t, lang } = useApp();

    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingKey, setDownloadingKey] = useState(null);

    const handleDownloadPdf = async (courseId, lessonId = null, fallbackTitle = 'الكورس', lessonNum = 1) => {
        const key = lessonId ? `lesson-${lessonId}` : `course-${courseId}`;
        if (downloadingKey) return;
        setDownloadingKey(key);
        try {
            await downloadCoursePdfFile({
                courseId,
                lessonId,
                fallbackFileName: lessonId
                    ? `${fallbackTitle} - محاضرة ${lessonNum || 1}.pdf`
                    : `${fallbackTitle} - كل المحاضرات.pdf`
            });
        } catch (err) {
            console.error('Failed to download PDF:', err);
        } finally {
            setDownloadingKey(null);
        }
    };

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'with_summary' | 'completed'

    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetchAllLessons();
                if (!isCancelled) {
                    if (res && Array.isArray(res.data)) {
                        setLessons(res.data);
                    } else if (Array.isArray(res)) {
                        setLessons(res);
                    } else {
                        setLessons([]);
                    }
                }
            } catch (err) {
                console.error('Failed to load lessons:', err);
                if (!isCancelled) setError(err.message || 'Error loading lessons');
            } finally {
                if (!isCancelled) setLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, []);

    // Unique courses list from lessons
    const courseOptions = useMemo(() => {
        const map = new Map();
        lessons.forEach(l => {
            if (l.course && l.course.id) {
                if (!map.has(l.course.id)) {
                    map.set(l.course.id, {
                        id: l.course.id,
                        title: l.course.title || `Course #${l.course.id}`,
                        instructor: l.course.presenter_name || l.course.instructor,
                        total_units: l.course.total_units || 0
                    });
                }
            }
        });
        return Array.from(map.values());
    }, [lessons]);

    // Filtered lessons
    const filteredLessons = useMemo(() => {
        return lessons.filter(l => {
            if (selectedCourseId !== 'all' && String(l.course_id) !== String(selectedCourseId)) {
                return false;
            }

            if (statusFilter === 'with_summary' && (l.content || l.summary || '').length < 200) {
                return false;
            }

            if (statusFilter === 'completed' && l.status !== 'completed' && l.progress_percentage < 100) {
                return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const titleMatch = (l.title || '').toLowerCase().includes(q);
                const descMatch = (l.description || '').toLowerCase().includes(q);
                const summaryMatch = (l.summary || '').toLowerCase().includes(q);
                const contentMatch = (l.content || '').toLowerCase().includes(q);
                const courseMatch = (l.course?.title || '').toLowerCase().includes(q);
                const instructorMatch = (l.course?.presenter_name || l.course?.instructor || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !summaryMatch && !contentMatch && !courseMatch && !instructorMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [lessons, selectedCourseId, statusFilter, searchQuery]);

    // Computed Stats
    const stats = useMemo(() => {
        const totalDuration = lessons.reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0);
        const hours = Math.round(totalDuration / 60);
        const withDetailedSummary = lessons.filter(l => (l.content || l.summary || '').length > 500).length;
        return {
            totalLectures: lessons.length,
            coveredCourses: courseOptions.length,
            totalHours: hours,
            totalMinutes: totalDuration,
            withSummary: withDetailedSummary
        };
    }, [lessons, courseOptions]);

    return (
        <div className="space-y-8 w-full max-w-[1780px] mx-auto pb-24 animate-in fade-in duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Banner matching LearningResourceLibrary aesthetic */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#BC5C29]/15 text-[#BC5C29] border border-[#BC5C29]/30">
                            {t("Curriculum & Knowledge Base", "قاعدة المعرفة والمناهج")}
                        </span>
                        <span className="text-zinc-400">/</span>
                        <span className="text-xs font-semibold text-zinc-500">
                            {t("All Ingested Lectures", "كافة المحاضرات الموثقة")}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-zinc-900 dark:text-zinc-100 tracking-tight font-normal">
                        {t("All Course Lectures & Study Guides", "فهرس المحاضرات والملخصات التحليلية")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-normal max-w-3xl leading-relaxed">
                        {t(
                            "Comprehensive index of all lectures across courses with analytical breakdowns, referenced literature, intellectual concepts, and instant PDF exports.",
                            "الفهرس الشامل لكافة المحاضرات عبر مختلف المسارات، مع التلخيصات الأكاديمية العميقة، الأعلام والكتب المستشهد بها، والمفاهيم التأسيسية وخيارات التصدير بصيغة PDF."
                        )}
                    </p>

                    {/* Stats summary pills */}
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{stats.totalLectures} {t("Lectures Ingested", "محاضرة موثقة")}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-[#BC5C29]" />
                            <span>{stats.coveredCourses} {t("Courses Covered", "مساراً تعليمياً")}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-sky-500" />
                            <span>{stats.totalHours} {t("Hours of Learning", "ساعة محتوى تعليمي")}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{stats.withSummary} {t("Scholarly Summaries", "ملخص أكاديمي متكامل")}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <Link
                        href="/courses/materials"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span>{t("Knowledge & Materials Library", "المكتبة المعرفية والمواد")}</span>
                    </Link>

                    {selectedCourseId !== 'all' ? (
                        <button
                            type="button"
                            onClick={() => {
                                const selectedCourseObj = courseOptions.find(c => String(c.id) === String(selectedCourseId));
                                handleDownloadPdf(selectedCourseId, null, selectedCourseObj?.title || 'الكورس');
                            }}
                            disabled={Boolean(downloadingKey)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#BC5C29] hover:bg-[#a94f20] disabled:opacity-60 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            {downloadingKey === `course-${selectedCourseId}` ? (
                                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 shrink-0" />
                            )}
                            <span>
                                {downloadingKey === `course-${selectedCourseId}`
                                    ? t("Preparing PDF...", "جاري تجهيز الكتاب...")
                                    : t("Download Course Book (PDF)", "تحميل كتاب الكورس كاملاً (PDF)")}
                            </span>
                        </button>
                    ) : (
                        <Link
                            href="/courses/hierarchy"
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <Layers className="w-4 h-4 text-[#BC5C29]" />
                            <span>{t("Skill Topology & Hierarchy", "شجرة المعرفة")}</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Filter and Controls Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px] sm:min-w-[280px] max-w-md">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t("Search lectures by title, theme, scholar, book...", "ابحث في المحاضرات، المحاور، الأعلام، الكتب...")}
                            className={`w-full bg-white dark:bg-zinc-900/90 border rounded-full ps-9.5 pe-9 py-2 text-xs font-medium outline-none transition shadow-2xs ${
                                searchQuery
                                    ? 'border-[#BC5C29] text-zinc-900 dark:text-white'
                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 hover:border-zinc-300 focus:border-[#BC5C29]'
                            }`}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Course Filter Dropdown Pill */}
                    <div className="relative shrink-0">
                        <select
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="appearance-none bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full ps-4 pe-8 py-2 text-xs font-bold outline-none cursor-pointer shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 max-w-[240px] truncate"
                        >
                            <option value="all">{t("All Courses", "كافة الكورسات")} ({lessons.length})</option>
                            {courseOptions.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Status Filter Pill */}
                    <div className="inline-flex items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                                statusFilter === 'all'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                        >
                            {t("All", "الكل")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('with_summary')}
                            className={`px-3 py-1 rounded-full font-bold transition cursor-pointer ${
                                statusFilter === 'with_summary'
                                    ? 'bg-white dark:bg-zinc-900 text-[#BC5C29] shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                            }`}
                        >
                            {t("Deep Summaries", "ملخصة بعمق")}
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-zinc-400 px-2">
                        {filteredLessons.length} {t("results", "محاضرة")}
                    </span>
                    <div className="bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 flex items-center">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                viewMode === 'grid'
                                    ? 'bg-white dark:bg-zinc-900 text-[#BC5C29] shadow-2xs'
                                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                            title={t("Grid View", "عرض الشبكة")}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                viewMode === 'table'
                                    ? 'bg-white dark:bg-zinc-900 text-[#BC5C29] shadow-2xs'
                                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                            }`}
                            title={t("Table View", "عرض الجدول")}
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading / Error States */}
            {loading && (
                <div className="p-16 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#BC5C29] border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs text-zinc-400">{t("Loading lectures index...", "جاري تحميل فهرس المحاضرات الشامل...")}</p>
                </div>
            )}

            {error && !loading && (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold text-center">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredLessons.length === 0 && (
                <div className="p-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
                    <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {t("No lectures match your filters", "لا توجد محاضرات تطابق معايير البحث")}
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {t("Try clearing your search query or choosing another course filter.", "جرب تعديل كلمة البحث أو اختيار كورس آخر.")}
                    </p>
                </div>
            )}

            {/* Grid View */}
            {!loading && !error && viewMode === 'grid' && filteredLessons.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                    {filteredLessons.map(lesson => {
                        const fullTextLen = (lesson.content || lesson.summary || '').length;
                        const hasDeepSummary = fullTextLen > 500;
                        const summaryExcerpt = (lesson.summary || lesson.content || '')
                            .replace(/[#*`_]/g, '')
                            .slice(0, 180)
                            .trim();

                        return (
                            <div
                                key={lesson.id}
                                className="group p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-[#BC5C29]/50 transition-all duration-200 shadow-2xs hover:shadow-card flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    {/* Card Top: Lesson #, Course badge, Duration */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-[#BC5C29]/10 text-[#BC5C29] border border-[#BC5C29]/20">
                                                #{lesson.lesson_number || '1'}
                                            </span>
                                            {lesson.course?.title && (
                                                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]" title={lesson.course.title}>
                                                    {lesson.course.title}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                                            {lesson.duration_minutes ? (
                                                <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                    <Clock className="w-3 h-3 text-sky-500" />
                                                    <span>{lesson.duration_minutes}m</span>
                                                </span>
                                            ) : null}
                                            {hasDeepSummary && (
                                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>{t("Scholarly", "مفصل")}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Link
                                        href={`/courses/${lesson.course_id}/lessons/${lesson.id}`}
                                        className="block group-hover:text-[#BC5C29] transition"
                                    >
                                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                                            {lesson.title}
                                        </h3>
                                    </Link>

                                    {/* Summary preview */}
                                    {summaryExcerpt && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                                            {summaryExcerpt}...
                                        </p>
                                    )}
                                </div>

                                {/* Card Bottom Actions */}
                                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Link
                                            href={`/courses/${lesson.course_id}/lessons/${lesson.id}`}
                                            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-[#BC5C29] hover:text-white dark:bg-zinc-800 dark:hover:bg-[#BC5C29] text-zinc-800 dark:text-zinc-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <BookOpen className="w-3 h-3" />
                                            <span>{t("Study Workspace", "مساحة المذاكرة")}</span>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleDownloadPdf(lesson.course_id, lesson.id, lesson.course?.title || 'الكورس', lesson.lesson_number)}
                                            disabled={Boolean(downloadingKey)}
                                            className="p-1.5 rounded-xl text-zinc-400 hover:text-[#BC5C29] hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
                                            title={t("Download this lecture as PDF", "تنزيل المحاضرة PDF مباشرة")}
                                        >
                                            {downloadingKey === `lesson-${lesson.id}` ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BC5C29]" />
                                            ) : (
                                                <Download className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    {lesson.source_url && (
                                        <a
                                            href={lesson.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 transition"
                                            title={t("Watch original lecture video", "مشاهدة المحاضرة على يوتيوب")}
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            <span>YouTube</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Table View */}
            {!loading && !error && viewMode === 'table' && filteredLessons.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-mono text-[10px]">
                                <tr>
                                    <th className="px-4 py-3 text-start w-16">#</th>
                                    <th className="px-4 py-3 text-start">{t("Lecture Title", "عنوان المحاضرة")}</th>
                                    <th className="px-4 py-3 text-start">{t("Course", "الكورس")}</th>
                                    <th className="px-4 py-3 text-start">{t("Duration", "المدة")}</th>
                                    <th className="px-4 py-3 text-start">{t("Summary Depth", "حجم التلخيص")}</th>
                                    <th className="px-4 py-3 text-end">{t("Actions", "إجراءات")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                                {filteredLessons.map(lesson => (
                                    <tr key={lesson.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition">
                                        <td className="px-4 py-3 font-mono font-bold text-[#BC5C29]">
                                            #{lesson.lesson_number || '1'}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                                            <Link
                                                href={`/courses/${lesson.course_id}/lessons/${lesson.id}`}
                                                className="hover:text-[#BC5C29] transition line-clamp-1"
                                            >
                                                {lesson.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                                            {lesson.course?.title || `Course #${lesson.course_id}`}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-zinc-500">
                                            {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {(lesson.content || lesson.summary || '').length > 200 ? (
                                                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                                                    {(lesson.content || lesson.summary || '').length.toLocaleString()} chars
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-zinc-400">Draft</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="inline-flex items-center gap-1.5">
                                                <Link
                                                    href={`/courses/${lesson.course_id}/lessons/${lesson.id}`}
                                                    className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#BC5C29] hover:text-white dark:bg-zinc-800 dark:hover:bg-[#BC5C29] text-zinc-800 dark:text-zinc-200 text-xs font-bold transition"
                                                >
                                                    {t("Open", "فتح")}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadPdf(lesson.course_id, lesson.id, lesson.course?.title || 'الكورس', lesson.lesson_number)}
                                                    disabled={Boolean(downloadingKey)}
                                                    className="p-1 rounded-lg text-zinc-400 hover:text-[#BC5C29] disabled:opacity-50 cursor-pointer"
                                                    title={t("Download PDF", "تنزيل PDF")}
                                                >
                                                    {downloadingKey === `lesson-${lesson.id}` ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BC5C29]" />
                                                    ) : (
                                                        <Download className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
