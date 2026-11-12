'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from '@/shared/next-compat/link';
import { useApp } from '@/shared/context/AppContext.js';
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Clock,
    Search,
    Plus,
    FolderPlus,
    BarChart3,
    Library,
    SlidersHorizontal,
    LayoutGrid,
    List,
    TrendingUp,
    Sparkles,
    User,
    Check,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { CourseCard } from './CourseCard.jsx';
import { fetchAllCourses, fetchCourseStats } from '@/features/learning/api/coursesOverview.api.js';

export function CourseLibraryView() {
    const { t, lang, setActiveDashboard } = useApp();

    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters and View Modes
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'in_progress' | 'completed' | 'paused'
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    useEffect(() => {
        if (setActiveDashboard) {
            setActiveDashboard('learning');
        }

        async function loadData() {
            setLoading(true);
            try {
                const [coursesRes, statsRes] = await Promise.all([
                    fetchAllCourses(),
                    fetchCourseStats()
                ]);

                if (coursesRes.ok && coursesRes.data) {
                    setCourses(coursesRes.data);
                }
                if (statsRes.ok && statsRes.data) {
                    setStats(statsRes.data);
                }
            } catch (err) {
                console.error('Failed to load courses data:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [setActiveDashboard]);

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set();
        courses.forEach(c => {
            if (c.category_path) set.add(c.category_path);
        });
        return Array.from(set);
    }, [courses]);

    // Filter courses
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            // Category Filter
            if (selectedCategory !== 'ALL' && course.category_path !== selectedCategory) {
                return false;
            }

            // Status Filter
            if (statusFilter !== 'ALL' && course.status !== statusFilter) {
                return false;
            }

            // Search Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = (course.title || '').toLowerCase().includes(q);
                const matchPresenter = (course.presenter_name || '').toLowerCase().includes(q);
                const matchDesc = (course.description || '').toLowerCase().includes(q);
                if (!matchTitle && !matchPresenter && !matchDesc) return false;
            }

            return true;
        });
    }, [courses, selectedCategory, statusFilter, searchQuery]);

    // KPI Summary Calculations
    const totalCoursesCount = courses.length;
    const inProgressCoursesCount = courses.filter(c => c.status === 'in_progress').length;
    const completedCoursesCount = courses.filter(c => c.status === 'completed').length;
    const overallProgressRate = stats?.overall_progress || (
        totalCoursesCount > 0
            ? Math.round(courses.reduce((acc, c) => acc + Number(c.progress_percentage || 0), 0) / totalCoursesCount)
            : 0
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
                <div>
                    <h1 className="text-[22px] font-bold text-ink tracking-tight flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <GraduationCap className="w-5 h-5" />
                        </span>
                        <span>{t("Course Library", "مكتبة التعلّم والكورسات")}</span>
                    </h1>
                    <p className="text-xs text-inkMuted mt-1 font-medium">
                        {t(
                            "Course management system, tracking curriculum units, lessons, and learning progress.",
                            "منظومة إدارة الكورسات، ومتابعة الوحدات والمحاضرات، ونسب التقدم المعرفي."
                        )}
                    </p>
                </div>

                {/* Quick Navigation Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/courses/add-course"
                        className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-[12.5px] font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-card cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("Add New Course", "إضافة كورس جديد")}</span>
                    </Link>

                    <Link
                        href="/courses/add-category"
                        className="px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-ink text-[12.5px] font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <FolderPlus className="w-4 h-4 text-primary" />
                        <span>{t("New Category", "تصنيف جديد")}</span>
                    </Link>

                    <Link
                        href="/courses/overview"
                        className="px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-ink text-[12.5px] font-medium transition flex items-center gap-1.5 cursor-pointer"
                        title={t("Analytics & Radar", "رادار الإحصائيات والتحليلات")}
                    >
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <span>{t("Stats Radar", "رادار الإحصائيات")}</span>
                    </Link>

                    <Link
                        href="/courses/materials"
                        className="px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-ink text-[12.5px] font-medium transition flex items-center gap-1.5 cursor-pointer"
                        title={t("Materials & Library", "المكتبة والملفات والماتريال")}
                    >
                        <Library className="w-4 h-4 text-primary" />
                        <span>{t("Materials & Files", "الماتريال والملفات")}</span>
                    </Link>
                </div>
            </div>

            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs space-y-1">
                    <span className="text-[11.5px] font-medium text-inkMuted">{t("Total Courses", "إجمالي الكورسات")}</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-ink font-mono">{totalCoursesCount}</span>
                        <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs space-y-1">
                    <span className="text-[11.5px] font-medium text-inkMuted">{t("In Progress", "قيد التعلّم")}</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-primary font-mono">{inProgressCoursesCount}</span>
                        <Clock className="w-4 h-4 text-primary" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs space-y-1">
                    <span className="text-[11.5px] font-medium text-inkMuted">{t("Completed", "المكتملة")}</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-emerald-500 font-mono">{completedCoursesCount}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-line bg-surface shadow-xs space-y-1">
                    <span className="text-[11.5px] font-medium text-inkMuted">{t("Overall Progress Rate", "معدل الإنجاز العام")}</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-ink font-mono">{overallProgressRate}%</span>
                        <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                </div>
            </div>

            {/* Search and Filters Toolbar */}
            <div className="p-4 rounded-2xl border border-line bg-surface/80 backdrop-blur-md space-y-3 shadow-xs">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="w-4 h-4 text-inkMuted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t("Search courses by title or instructor...", "بحث في الكورسات بالعنوان أو اسم المحاضر...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ps-9 pe-4 py-2 rounded-xl bg-surfaceMuted border border-line text-[13px] text-ink placeholder:text-inkMuted focus:outline-none focus:border-primary/50 transition"
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-surfaceMuted border border-line text-[12.5px] text-ink focus:outline-none focus:border-primary/50 transition cursor-pointer"
                        >
                            <option value="ALL">{t("All Categories", "جميع التصنيفات")} ({categories.length})</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex items-center rounded-xl border border-line bg-surfaceMuted p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    'p-1.5 rounded-lg transition cursor-pointer',
                                    viewMode === 'grid' ? 'bg-surface text-primary shadow-xs' : 'text-inkMuted hover:text-ink'
                                )}
                                title={t("Grid View", "عرض شبكة")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-1.5 rounded-lg transition cursor-pointer',
                                    viewMode === 'list' ? 'bg-surface text-primary shadow-xs' : 'text-inkMuted hover:text-ink'
                                )}
                                title={t("List View", "عرض قائمة")}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    {[
                        { id: 'ALL', label: t("All", "الكل"), count: courses.length },
                        { id: 'in_progress', label: t("In Progress", "قيد التعلّم"), count: inProgressCoursesCount },
                        { id: 'completed', label: t("Completed", "مكتمل"), count: completedCoursesCount },
                        { id: 'paused', label: t("Paused", "متوقف مؤقتاً"), count: courses.filter(c => c.status === 'paused').length }
                    ].map((tab) => {
                        const isSelected = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0',
                                    isSelected
                                        ? 'bg-primary text-on-primary shadow-xs'
                                        : 'bg-surfaceMuted/60 text-inkMuted hover:bg-surfaceMuted hover:text-ink'
                                )}
                            >
                                <span>{tab.label}</span>
                                <span className={cn('text-[10px] px-1.5 py-0.2 rounded-full font-mono', isSelected ? 'bg-black/20 text-white' : 'bg-surface text-inkMuted')}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Courses Content List / Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-44 rounded-2xl border border-line bg-surface animate-pulse p-5" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-line bg-surface/50 p-8 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surfaceMuted border border-line flex items-center justify-center mx-auto text-inkMuted">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-ink">{t("No courses match current filters", "لا توجد كورسات مطابقة للفلاتر")}</h3>
                    <p className="text-xs text-inkMuted max-w-sm mx-auto">
                        {t(
                            "Try adjusting your search criteria or filter categories, or add a new course to your curriculum.",
                            "جرب تغيير معايير البحث أو تصفية التصنيفات، أو قم بإضافة كورس جديد لمصفوفة التعلم."
                        )}
                    </p>
                    <Link
                        href="/courses/add-course"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition mt-2 shadow-card cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("Add New Course", "إضافة كورس جديد")}</span>
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-surface shadow-xs">
                    {filteredCourses.map((course) => {
                        const progress = Number(course.progress_percentage || 0);
                        return (
                            <div key={course.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surfaceMuted/40 transition">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] px-2 py-0.5 rounded bg-surfaceMuted border border-line font-medium text-inkSecondary truncate max-w-[140px]">
                                            {course.category_path || t("General", "عام")}
                                        </span>
                                        <Link href={`/courses/${course.id}`} className="font-bold text-[14px] text-ink hover:text-primary transition truncate cursor-pointer">
                                            {course.title}
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11.5px] text-inkMuted">
                                        {course.presenter_name && <span>{t("Instructor:", "المحاضر:")} {course.presenter_name}</span>}
                                        <span>{t("Units:", "الوحدات:")} {course.completed_units || 0} / {course.total_units || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="w-24 hidden sm:block">
                                        <div className="flex justify-between text-[11px] font-mono text-inkMuted mb-1">
                                            <span>{t("Progress", "التقدم")}</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-surfaceMuted overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    <Link
                                        href={`/courses/${course.id}`}
                                        className="px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surfaceMuted text-xs font-semibold text-primary transition cursor-pointer"
                                    >
                                        {t("Open Course", "فتح الكورس")}
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default CourseLibraryView;
