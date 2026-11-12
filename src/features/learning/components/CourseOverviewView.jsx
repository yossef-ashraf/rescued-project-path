'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from '@/shared/next-compat/link';
import { useApp } from '@/shared/context/AppContext.jsx';
import ProductivityHeatmap from '@/components/shared/ProductivityHeatmap';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from 'recharts';
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FolderTree,
    FileText,
    TrendingUp,
    Plus,
    ExternalLink,
    PlayCircle,
    Download,
    Sparkles,
    ChevronRight,
    Edit3,
    BarChart2,
    ListFilter,
    StickyNote
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/features/sharing';
import { fetchCourseStats, fetchAllCourses, updateCourseProgress } from '@/features/learning/api/coursesOverview.api.js';
import { RESOURCE_ICONS } from '@/features/learning/constants/coursesOverview.constants.js';
import {
    calculateCategoryCompletion,
    calculateCategoryVolume,
    calculateCourseProgressRankings,
    calculateCourseUnitsRankings,
    calculateCategoryCompetency
} from '@/features/learning/utils/coursesOverview.logic.js';
import PeriodSelector, { getPeriodRange, isInPeriod } from '@/components/ui/PeriodSelector';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';

export default function CourseOverviewView() {
    const { t, setActiveDashboard } = useApp();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingCourseId, setUpdatingCourseId] = useState(null);
    const [allCoursesList, setAllCoursesList] = useState([]);
    const [competencyViewMode, setCompetencyViewMode] = useState('bars');
    const [competencyFilter, setCompetencyFilter] = useState('active');
    const [statsPeriod, setStatsPeriod] = useState('all');

    const loadStats = useCallback(async () => {
        try {
            const [payload, coursesList] = await Promise.all([
                fetchCourseStats(),
                fetchAllCourses()
            ]);
            if (payload) setData(payload);
            setAllCoursesList(coursesList);
        } catch (err) {
            console.error('Error loading course stats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setActiveDashboard('courses');
        Promise.all([
            fetchCourseStats(),
            fetchAllCourses()
        ]).then(([payload, coursesList]) => {
            if (payload) setData(payload);
            setAllCoursesList(coursesList);
            setLoading(false);
        }).catch(err => {
            console.error('Error loading course stats:', err);
            setLoading(false);
        });
    }, [setActiveDashboard]);

    const stats = useMemo(() => data?.stats || {}, [data]);
    const radarData = useMemo(() => data?.radarData || [], [data]);
    const statusDistribution = useMemo(() => data?.statusDistribution || [], [data]);
    const continueLearning = useMemo(() => data?.continueLearning || [], [data]);
    const categoryBreakdown = useMemo(() => data?.categoryBreakdown || [], [data]);

    const categoryCompletionData = useMemo(() => calculateCategoryCompletion(categoryBreakdown), [categoryBreakdown]);
    const categoryVolumeData = useMemo(() => calculateCategoryVolume(categoryBreakdown), [categoryBreakdown]);
    const courseProgressData = useMemo(() => calculateCourseProgressRankings(allCoursesList), [allCoursesList]);
    const courseUnitsData = useMemo(() => calculateCourseUnitsRankings(allCoursesList), [allCoursesList]);
    const categoryCompetencyData = useMemo(() => calculateCategoryCompetency(radarData), [radarData]);

    const statsPeriodRange = useMemo(() => getPeriodRange(statsPeriod), [statsPeriod]);

    const periodCourses = useMemo(() => {
        if (!statsPeriodRange) return allCoursesList;
        return allCoursesList.filter(c =>
            isInPeriod(c.created_at || c.updated_at || null, statsPeriodRange)
        );
    }, [allCoursesList, statsPeriodRange]);

    const periodStats = useMemo(() => {
        const courses = periodCourses.filter(c => c.type !== 'category');
        const total = courses.length;
        const completed = courses.filter(c => c.status === 'completed' || Number(c.progress_percentage) >= 100).length;
        const inProgress = courses.filter(c => c.status === 'in_progress' || (Number(c.progress_percentage) > 0 && Number(c.progress_percentage) < 100)).length;
        const overdue = courses.filter(c => c.target_date && new Date(c.target_date) < new Date() && Number(c.progress_percentage || 0) < 100).length;
        const totalUnits = courses.reduce((s, c) => s + (Number(c.total_units) || 0), 0);
        const completedUnits = courses.reduce((s, c) => s + (Number(c.completed_units) || 0), 0);
        const overallProgress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
        const categories = new Set(periodCourses.filter(c => c.type === 'category').map(c => c.id));
        return { totalCourses: total, completedCount: completed, inProgressCount: inProgress, overdueCount: overdue, totalUnits, completedUnits, overallProgress, totalCategories: categories.size };
    }, [periodCourses]);

    const activeCompetencyCount = useMemo(() => {
        return categoryCompetencyData.filter(d => (d.score || 0) > 0 || (d.completedUnits || 0) > 0).length;
    }, [categoryCompetencyData]);

    const filteredCompetencyData = useMemo(() => {
        if (competencyFilter === 'active') {
            const active = categoryCompetencyData.filter(d => (d.score || 0) > 0 || (d.completedUnits || 0) > 0);
            return active.length > 0 ? active : categoryCompetencyData;
        }
        return categoryCompetencyData;
    }, [categoryCompetencyData, competencyFilter]);

    const handleQuickIncrement = async (course) => {
        if (updatingCourseId) return;
        const nextUnits = Math.min(course.total_units || 1, (course.completed_units || 0) + 1);
        setUpdatingCourseId(course.id);
        try {
            const res = await updateCourseProgress(course.id, nextUnits, course.total_units);
            if (res.success || res.ok) {
                await loadStats();
            }
        } catch (err) {
            console.error('Error updating progress:', err);
        } finally {
            setUpdatingCourseId(null);
        }
    };

    if (loading) {
        return <PageDashboardSkeleton />;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-24 w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center font-bold">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            {t("Courses & Learning Analytics", "لوحة الكورسات والتعلم")}
                        </h1>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {t(
                            "Track learning milestones, category competencies, and ongoing study roadmap.",
                            "متابعة إنجاز الكورسات، المهارات والتصنيفات، ومسار التعلم المباشر."
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={() => {
                            const a = document.createElement('a');
                            a.href = '/api/courses?export=json';
                            a.download = `courses_export_${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                        }}
                        title={t("Export Courses Backup", "تصدير نسخة احتياطية")}
                        className="cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("Export JSON", "تصدير JSON")}</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="default"
                        asChild
                        title={t("Browse and export all course books as PDF", "فهرس وتحميل كافة كتب المقررات PDF")}
                        className="text-primary border-primary/30 bg-primary/8 hover:bg-primary/14 cursor-pointer"
                    >
                        <Link href="/courses/materials/lessons">
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("All Course Books PDF", "كتب المقررات PDF")}</span>
                        </Link>
                    </Button>

                    <Button
                        variant="secondary"
                        size="default"
                        asChild
                        className="cursor-pointer"
                    >
                        <Link href="/courses/hierarchy">
                            <FolderTree className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{t("Course Tree", "شجرة الكورسات")}</span>
                        </Link>
                    </Button>

                    <Button
                        variant="secondary"
                        size="default"
                        asChild
                        className="cursor-pointer"
                    >
                        <Link href="/courses/materials">
                            <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{t("Knowledge & Materials", "المكتبة المعرفية")}</span>
                        </Link>
                    </Button>

                    <Button
                        variant="default"
                        size="default"
                        asChild
                        className="cursor-pointer"
                    >
                        <Link href="/courses/add-course">
                            <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                            <span>{t("Add Course", "إضافة كورس")}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        {t("Learning KPIs & Competency Metrics", "مؤشرات الإنجاز والتعلم الكلي")}
                    </h3>
                    <PeriodSelector value={statsPeriod} onChange={setStatsPeriod} t={t} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center">
                                    <BookOpen size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {t("Total Courses", "إجمالي الكورسات")}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BC5C29]/10 text-[#BC5C29]">
                                {periodStats.totalCategories} {t("Cats", "تصنيف")}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Enrolled courses", "جميع الكورسات المسجلة")}</span>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                                    {periodStats.totalCourses}
                                </h2>
                                <span className="text-xs font-bold text-zinc-400">
                                    / {periodStats.totalUnits} {t("units", "وحدة")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {t("Completed Rate", "نسبة الإنجاز")}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                {periodStats.completedCount} {t("Done", "مكتمل")}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                                {periodStats.completedUnits} / {periodStats.totalUnits} {t("units completed", "وحدة منجزة")}
                            </span>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {periodStats.overallProgress}%
                                </h2>
                                <div className="flex-1 max-w-[80px] bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${periodStats.overallProgress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center">
                                    <Clock size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {t("In Progress", "قيد الدراسة")}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Active learning", "كورسات نشطة حالياً")}</span>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-black text-[#BC5C29]">
                                    {periodStats.inProgressCount}
                                </h2>
                                <span className="text-xs font-bold text-zinc-400">
                                    {t("courses", "كورس")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                    <AlertTriangle size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {t("Overdue", "متأخر عن الموعد")}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Exceeded target date", "تجاوزت التاريخ المحدد")}</span>
                            <div className="flex items-baseline gap-2">
                                <h2 className={`text-2xl font-black ${periodStats.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                                    {periodStats.overdueCount}
                                </h2>
                                <span className="text-xs font-bold text-zinc-400">
                                    {t("courses", "كورس")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-3 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <FileText size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    {t("Materials & Notes", "الماتريال والملفات")}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Attached resources", "الملفات والملاحظات")}</span>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                    {stats.filesCount || 0}
                                </h2>
                                <span className="text-xs font-bold text-zinc-400">
                                    {t("files", "ملف")} • {stats.commentsCount || 0} {t("notes", "ملاحظة")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <ProductivityHeatmap tasks={[]} todos={[]} courses={allCoursesList} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#BC5C29]" />
                        <span>{t("Learning Hub Insights & Progress Rankings", "تحليلات وترتيب تقدم الكورسات")}</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Category Completion Rate */}
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between min-h-[240px]">
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {t("Category Completion Rate", "نسبة إنجاز التصنيفات")}
                                </h3>
                                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">%</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3">
                                {t("Top completed categories", "التصنيفات الأكثر إنجازاً")}
                            </p>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            {categoryCompletionData.length === 0 ? (
                                <p className="text-[11px] text-zinc-400 text-center py-4">{t("No data available", "لا توجد بيانات")}</p>
                            ) : (
                                categoryCompletionData.map((item, idx) => (
                                    <div key={`cat-comp-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span dir="auto" title={item.name} className="font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 text-[11px]">
                                                {item.name}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-[11px]">
                                                {item.rate}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(0, item.rate))}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 2. Category Volume & Items */}
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between min-h-[240px]">
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {t("Category Volume & Items", "كثافة عناصر التصنيف")}
                                </h3>
                                <span className="text-[10px] font-mono font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md">Items</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3">
                                {t("Most loaded course categories", "التصنيفات الأكثر محتوى وكورسات")}
                            </p>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            {categoryVolumeData.length === 0 ? (
                                <p className="text-[11px] text-zinc-400 text-center py-4">{t("No data available", "لا توجد بيانات")}</p>
                            ) : (
                                categoryVolumeData.map((item, idx) => {
                                    const maxCount = Math.max(...categoryVolumeData.map(d => d.count || 1), 1);
                                    const percent = Math.min(100, Math.round((item.count / maxCount) * 100));
                                    return (
                                        <div key={`cat-vol-${idx}`} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <span dir="auto" title={item.name} className="font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 text-[11px]">
                                                    {item.name}
                                                </span>
                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 text-[11px]">
                                                    {item.count} {t("courses", "كورس")}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 3. Top Courses Progress */}
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between min-h-[240px]">
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {t("Top Courses Progress", "أعلى الكورسات في التقدم")}
                                </h3>
                                <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded-md">%</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3">
                                {t("Courses closest to completion", "الكورسات الأقرب للإنهاء")}
                            </p>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            {courseProgressData.length === 0 ? (
                                <p className="text-[11px] text-zinc-400 text-center py-4">{t("No data available", "لا توجد بيانات")}</p>
                            ) : (
                                courseProgressData.map((item, idx) => (
                                    <div key={`crs-prog-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span dir="auto" title={item.name} className="font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 text-[11px]">
                                                {item.name}
                                            </span>
                                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 shrink-0 text-[11px]">
                                                {item.progress}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 4. Course Scale & Units */}
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between min-h-[240px]">
                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {t("Course Scale & Units", "أكبر الكورسات حجماً ووحدات")}
                                </h3>
                                <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">Units</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 mb-3">
                                {t("Courses with most total units", "الكورسات الأعلى في عدد الوحدات")}
                            </p>
                        </div>

                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            {courseUnitsData.length === 0 ? (
                                <p className="text-[11px] text-zinc-400 text-center py-4">{t("No data available", "لا توجد بيانات")}</p>
                            ) : (
                                courseUnitsData.map((item, idx) => {
                                    const maxUnits = Math.max(...courseUnitsData.map(d => d.units || 1), 1);
                                    const percent = Math.min(100, Math.round((item.units / maxUnits) * 100));
                                    return (
                                        <div key={`crs-unit-${idx}`} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <span dir="auto" title={item.name} className="font-bold text-zinc-800 dark:text-zinc-200 truncate flex-1 text-[11px]">
                                                    {item.name}
                                                </span>
                                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 text-[11px]">
                                                    {item.units} {t("units", "وحدة")}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#BC5C29]" />
                                <span>{t("Category Progress & Competency Balance", "توازن التعلم وتوزيع المهارات")}</span>
                            </h3>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                {t("Distribution of completed units across learning domains", "توزيع الوحدات المنجزة ونسبة التقدم لكل تصنيف")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setCompetencyFilter('active')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1.5 cursor-pointer",
                                        competencyFilter === 'active'
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                >
                                    <span>{t("Active", "النشطة")}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold">
                                        {activeCompetencyCount}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompetencyFilter('all')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1.5 cursor-pointer",
                                        competencyFilter === 'all'
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                >
                                    <span>{t("All", "الكل")}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono font-bold">
                                        {categoryCompetencyData.length}
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                <button
                                    type="button"
                                    onClick={() => setCompetencyViewMode('bars')}
                                    title={t("Bars View", "عرض الأشرطة")}
                                    className={cn(
                                        "p-1.5 rounded-lg transition cursor-pointer",
                                        competencyViewMode === 'bars'
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                                            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                    )}
                                >
                                    <ListFilter className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompetencyViewMode('chart')}
                                    title={t("Chart View", "عرض المخطط البياني")}
                                    className={cn(
                                        "p-1.5 rounded-lg transition cursor-pointer",
                                        competencyViewMode === 'chart'
                                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                                            : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                    )}
                                >
                                    <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {competencyViewMode === 'bars' ? (
                        <div className="h-[280px] overflow-y-auto space-y-2.5 pr-1.5">
                            {filteredCompetencyData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-bold">
                                    {t("No categories found", "لا توجد تصنيفات")}
                                </div>
                            ) : (
                                filteredCompetencyData.map((item, idx) => {
                                    const isComplete = item.score >= 100;
                                    const hasStarted = item.score > 0 || item.completedUnits > 0;

                                    return (
                                        <div
                                            key={`${item.name}-${idx}`}
                                            className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                                        >
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={cn(
                                                            "w-2 h-2 rounded-full shrink-0",
                                                            isComplete
                                                                ? "bg-emerald-500"
                                                                : hasStarted
                                                                    ? "bg-blue-500"
                                                                    : "bg-zinc-400/50"
                                                        )}
                                                    />
                                                    <span
                                                        dir="auto"
                                                        title={item.name}
                                                        className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate"
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                        {item.completedUnits} / {item.totalUnits} {t('units', 'وحدة')}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-[11px] font-mono font-bold px-2 py-0.5 rounded-md",
                                                            isComplete
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : hasStarted
                                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                                        )}
                                                    >
                                                        {item.score}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full bg-zinc-200/60 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        isComplete
                                                            ? "bg-emerald-500"
                                                            : hasStarted
                                                                ? "bg-blue-500"
                                                                : "bg-transparent"
                                                    )}
                                                    style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        <div className="h-[280px] w-full overflow-y-auto pr-1">
                            <div style={{ height: `${Math.max(260, filteredCompetencyData.length * 36)}px`, minWidth: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={filteredCompetencyData}
                                        margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" opacity={0.2} />
                                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#71717a', fontSize: 11 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={({ x, y, payload }) => {
                                                const raw = payload?.value || '';
                                                const truncated = raw.length > 20 ? `${raw.slice(0, 18)}…` : raw;
                                                return (
                                                    <g transform={`translate(${x},${y})`}>
                                                        <text
                                                            x={-8}
                                                            y={4}
                                                            textAnchor="end"
                                                            fill="#a1a1aa"
                                                            fontSize={11}
                                                            fontWeight={600}
                                                        >
                                                            <title>{raw}</title>
                                                            {truncated}
                                                        </text>
                                                    </g>
                                                );
                                            }}
                                            width={130}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--ds-surface-2, #0e0e119e)',
                                                borderColor: 'var(--ds-border, #27272a)',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                color: 'var(--ds-text-1, #fff)'
                                            }}
                                            formatter={(val, name, item) => [
                                                `${val}% (${item.payload.completedUnits}/${item.payload.totalUnits} ${t('units', 'وحدة')})`,
                                                t('Progress', 'التقدم')
                                            ]}
                                        />
                                        <Bar dataKey="score" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-1">
                            {t("Status Breakdown", "توزيع حالات الكورسات")}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mb-2">
                            {t("Active vs completed vs pending items", "مقارنة نسب الإنجاز والمؤجلات")}
                        </p>
                    </div>

                    <div className="h-[210px] w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={82}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#888'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--ds-surface-2, #0e0e119e)', borderColor: 'var(--ds-border, #27272a)', borderRadius: '12px', fontSize: '11px', color: 'var(--ds-text-1, #fff)' }}
                                    formatter={(val) => [`${val} ${t('courses', 'كورس')}`, t('Count', 'العدد')]}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {stats.totalCourses || 0}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                {t("Courses", "كورس")}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-bold">
                        {statusDistribution.map(item => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-zinc-600 dark:text-zinc-400">{item.name}: <strong className="text-zinc-900 dark:text-white">{item.value}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 text-emerald-500" />
                            <span>{t("Active Learning Roadmap & Continue Studying", "مسار التعلم النشط ومتابعة الدراسة")}</span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {t("Pick up where you left off with one-click progress updates", "أكمل دراستك مباشرة بضغطة زر وتحديث الإنجاز")}
                        </p>
                    </div>

                    <Link
                        href="/courses/hierarchy"
                        className="text-xs font-bold text-[#BC5C29] dark:text-[#BC5C29] hover:underline flex items-center gap-1"
                    >
                        <span>{t("View All in Tree", "عرض الكل في الشجرة")}</span>
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {continueLearning.map(course => {
                        const progress = Number(course.progress_percentage || 0);
                        const rIcon = RESOURCE_ICONS[course.resource_type] || '📄';
                        const isYouTube = course.url && (course.url.includes('youtube.com') || course.url.includes('youtu.be'));

                        return (
                            <div
                                key={course.id}
                                className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#BC5C29]/50 hover:shadow-md transition duration-200 group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50 truncate max-w-[140px]">
                                                📁 {course.categoryTitle}
                                            </span>
                                            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                                <span>{rIcon}</span>
                                                <span>{course.resource_type || 'Doc'}</span>
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <ShareButton
                                                entityType="course"
                                                entityId={course.id}
                                                entityTitle={course.title}
                                                variant="icon"
                                                size="xs"
                                            />
                                            <Link
                                                href={`/courses/edit/${course.id}`}
                                                className="p-1.5 rounded-xl text-zinc-400 hover:text-[#BC5C29] hover:bg-[#BC5C29]/10 dark:hover:bg-[#BC5C29]/10 transition shrink-0"
                                                title={t("Edit course", "تعديل الكورس")}
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/courses/${course.id}`}
                                        className="block group/link transition cursor-pointer"
                                        title={t("Open course workspace & lessons", "فتح مساحة عمل الكورس والمحاضرات")}
                                    >
                                        <h4
                                            dir="auto"
                                            style={{ unicodeBidi: 'plaintext' }}
                                            className="text-sm font-black text-zinc-900 dark:text-white leading-snug group-hover:text-[#BC5C29] transition line-clamp-2 text-start"
                                        >
                                            {course.title}
                                        </h4>
                                    </Link>

                                    {course.url && (
                                        <div className="pt-1">
                                            {isYouTube ? (
                                                <a
                                                    href={course.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-[11px] hover:bg-red-500/20 transition border border-red-200/60 dark:border-red-900/40"
                                                    title={course.url}
                                                >
                                                    <PlayCircle className="w-3.5 h-3.5 fill-red-600 text-white dark:fill-red-400 dark:text-zinc-900 shrink-0" />
                                                    <span>{t("Watch on YouTube", "شاهد على يوتيوب")}</span>
                                                </a>
                                            ) : (
                                                <a
                                                    href={course.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#BC5C29]/10 dark:bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] font-bold text-[11px] hover:bg-[#BC5C29]/20 transition border border-[#BC5C29]/30 dark:border-[#BC5C29]/40 max-w-full"
                                                    title={course.url}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate">{t("Open Resource", "فتح الرابط / المصدر")}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-bold text-zinc-500">
                                            {course.completed_units || 0} / {course.total_units || 1} {t("Units", "وحدة")}
                                        </span>
                                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                                            {progress}%
                                        </span>
                                    </div>

                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300 bg-[#BC5C29]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-between gap-2">
                                        <Link
                                            href={`/courses/${course.id}`}
                                            className="py-1.5 px-3 rounded-xl bg-[#BC5C29]/10 hover:bg-[#BC5C29]/20 text-[#BC5C29] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                                            title={t("Open course workspace & lessons", "فتح مساحة عمل الكورس والمحاضرات")}
                                        >
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>{t("Lessons", "المحاضرات")}</span>
                                        </Link>

                                        <button
                                            onClick={() => handleQuickIncrement(course)}
                                            disabled={updatingCourseId === course.id || (course.completed_units || 0) >= (course.total_units || 1)}
                                            className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            {updatingCourseId === course.id ? (
                                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    <span>+1</span>
                                                    <span>{t("Unit Done", "أنجزت وحدة")}</span>
                                                </>
                                            )}
                                        </button>

                                        <Link
                                            href={`/courses/hierarchy`}
                                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                                            title={t("View in hierarchy", "عرض في الشجرة")}
                                        >
                                            <FolderTree className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
