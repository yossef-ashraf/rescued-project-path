'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from '@/shared/next-compat/navigation';
import {
    ShieldCheck,
    Clock,
    AlertCircle,
    BookOpen,
    CheckCircle,
    FileText,
    Calendar,
    ExternalLink,
    GraduationCap,
    FolderTree,
    Layers,
    Crosshair,
    Code,
    Sparkles,
    Lock,
    Search,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { useApp } from '@/shared/context/AppContext.js';

function formatRemainingTime(seconds, lang = 'en') {
    if (seconds === null) return '...';
    if (seconds <= 0) return lang === 'ar' ? 'منتهي الصلاحية' : 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        if (lang === 'ar') {
            return `${hours} ساعة و ${minutes} دقيقة و ${secs} ثانية`;
        }
        return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function PublicShareView() {
    const params = useParams();
    const token = params?.token;
    const { t, lang } = useApp();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [lessonSearch, setLessonSearch] = useState('');

    // Real-time live countdown timer
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [isLiveExpired, setIsLiveExpired] = useState(false);

    useEffect(() => {
        if (!token) return;

        fetch(`/api/public/share/${encodeURIComponent(token)}`)
            .then(async (res) => {
                if (res.ok) {
                    return res.json();
                }
                const fallback = await fetch(`/api/share/resolve?token=${encodeURIComponent(token)}`);
                const fbData = await fallback.json();
                if (fbData?.success && fbData?.data?.valid) {
                    return fbData.data;
                }
                const errJson = await res.json().catch(() => ({}));
                const message = errJson.error || fbData?.error?.message || t(
                    'This temporary link has expired and was permanently deleted from the database.',
                    'انتهت صلاحية هذا الرابط المؤقت وتم حذفه نهائياً من قاعدة البيانات.'
                );
                throw new Error(message);
            })
            .then(data => {
                if (data?.valid) {
                    setResult(data);
                } else {
                    setError(data?.reason || t(
                        'This temporary link has expired and was permanently deleted from the database.',
                        'انتهت صلاحية هذا الرابط المؤقت وتم حذفه نهائياً من قاعدة البيانات.'
                    ));
                }
            })
            .catch(err => {
                setError(err.message || t('Failed to load shared content', 'تعذر تحميل بيانات المشاركة'));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [token, t]);

    // Live countdown effect
    useEffect(() => {
        if (!result?.expiresAt) return;

        const tick = () => {
            const diff = Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000);
            if (diff <= 0) {
                setRemainingSeconds(0);
                setIsLiveExpired(true);
            } else {
                setRemainingSeconds(diff);
            }
        };

        tick();
        const timerId = setInterval(tick, 1000);
        return () => clearInterval(timerId);
    }, [result?.expiresAt]);

    const isSnapshot = Boolean(result?.data?.htmlSnapshot);
    const isComponent = result?.entityType === 'component' || Boolean(result?.data?.componentTitle);

    // Filter lessons in course view
    const rawLessons = result?.data?.lessons;
    const filteredLessons = useMemo(() => {
        const lessons = Array.isArray(rawLessons) ? rawLessons : [];
        if (!lessonSearch.trim()) return lessons;
        const q = lessonSearch.toLowerCase();
        return lessons.filter(l =>
            (l.title && l.title.toLowerCase().includes(q)) ||
            (l.summary && l.summary.toLowerCase().includes(q)) ||
            String(l.lesson_number).includes(q)
        );
    }, [rawLessons, lessonSearch]);

    // Timer color classes
    const timerStatusClasses = useMemo(() => {
        if (remainingSeconds === null) return 'text-slate-400 bg-slate-800/60 border-slate-700';
        if (remainingSeconds <= 120) return 'text-rose-400 bg-rose-950/40 border-rose-500/40 animate-pulse';
        if (remainingSeconds <= 600) return 'text-amber-400 bg-amber-950/40 border-amber-500/40';
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    }, [remainingSeconds]);

    return (
        <div className="dark min-h-screen bg-[#09090b] text-zinc-100 flex flex-col select-text font-sans selection:bg-indigo-500/30" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Security & Expiration Sticky Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                        Ω
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white tracking-tight">ORBIT</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/25 font-semibold">
                            {t('Secure Temporary Share', 'مشاركة مؤقتة معزولة')}
                        </span>
                        {result?.data?.pageUrl && (
                            <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50" dir="ltr">
                                {result.data.pageUrl}
                            </span>
                        )}
                    </div>
                </div>

                {/* Live Expiration Badge & Protected Status */}
                <div className="flex items-center gap-2.5">
                    {result && !isLiveExpired && (
                        <div className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono font-bold transition shadow-xs',
                            timerStatusClasses
                        )}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                            </span>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('Expires in:', 'يُحذف خلال:')} {formatRemainingTime(remainingSeconds, lang)}</span>
                        </div>
                    )}

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-lg font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('Read Only', 'للقراءة فقط')}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col w-full">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 max-w-md w-full space-y-4 shadow-xl text-center">
                            <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-slate-400 font-medium">
                                {t('Verifying token and loading isolated content...', 'جاري التحقق من صلاحية الرابط وتحميل المحتوى المعزول...')}
                            </p>
                        </div>
                    </div>
                ) : (error || isLiveExpired) ? (
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl max-w-lg w-full animate-in fade-in zoom-in-95">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <h2 className="text-base font-black text-white">
                                {isLiveExpired 
                                    ? t('This temporary link has expired', 'انتهت صلاحية هذا الرابط المؤقت')
                                    : t('Unable to access this link', 'تعذر الوصول إلى هذا الرابط')}
                            </h2>
                            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                                {isLiveExpired
                                    ? t(
                                        'The designated duration for this temporary link has elapsed and it has been permanently purged from the database to safeguard data privacy.',
                                        'انتهت المدة المحددة لهذا الرابط المؤقت وتم حذفه نهائياً من قاعدة البيانات حفاظاً على سرية وخصوصية البيانات.'
                                      )
                                    : error}
                            </p>
                            <div className="pt-2 text-[11px] text-slate-400 font-mono">
                                Orbit Temporary Share Engine v2 • Auto-Purge Policy Active
                            </div>
                        </div>
                    </div>
                ) : result?.data ? (
                    isSnapshot ? (
                        isComponent ? (
                            /* VIEW 1A: Isolated Single Component Snapshot (Pure screen, zero artificial margins or blue voids) */
                            <div className="w-full flex-1 flex flex-col items-stretch justify-start p-2 sm:p-4 animate-in fade-in duration-200">
                                <div className="w-full overflow-hidden bg-transparent">
                                    <div
                                        className="orbit-public-shared-render w-full select-text leading-relaxed font-sans"
                                        dangerouslySetInnerHTML={{ __html: result.data.htmlSnapshot }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* VIEW 1B: Full Page Snapshot (Pure edge-to-edge screen, zero artificial margins) */
                            <div className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in duration-200">
                                <div
                                    className="orbit-public-shared-render w-full flex-1 min-w-0 select-text leading-relaxed font-sans"
                                    dangerouslySetInnerHTML={{ __html: result.data.htmlSnapshot }}
                                />
                            </div>
                        )
                    ) : result.entityType === 'course' ? (
                        /* VIEW 2: Structured Course Full Dashboard */
                        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 flex-1 space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl divide-y divide-slate-800/80">
                                {/* Course Hero Header */}
                                <div className="p-6 sm:p-8 bg-slate-900/40 space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {result.data.category_path && (
                                            <span className="text-[11px] font-semibold text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20">
                                                {result.data.category_path}
                                            </span>
                                        )}
                                        {result.data.status && (
                                            <span className="text-[11px] text-slate-300 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                                                {t('Status:', 'الحالة:')} {result.data.status}
                                            </span>
                                        )}
                                        <span className="text-[11px] text-slate-400 ms-auto font-mono">
                                            {t('Course ID:', 'معرف الدورة:')} #{result.data.id}
                                        </span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        {result.data.title}
                                    </h1>

                                    {result.data.presenter_name && (
                                        <p className="text-xs text-slate-300 font-medium">
                                            {t('Instructor / Presenter:', 'المحاضر / مقدم الكورس:')} <span className="text-white font-bold">{result.data.presenter_name}</span>
                                        </p>
                                    )}

                                    {result.data.description && (
                                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {result.data.description}
                                        </p>
                                    )}

                                    {/* Metrics Bar */}
                                    <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800">
                                        <div>
                                            <span className="text-slate-400">{t('Total Units:', 'إجمالي الوحدات:')} </span>
                                            <span className="font-bold text-white font-mono">{result.data.total_units || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">{t('Completed:', 'المكتمل:')} </span>
                                            <span className="font-bold text-white font-mono">{result.data.completed_units || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">{t('Progress:', 'نسبة الإنجاز:')} </span>
                                            <span className="font-bold text-emerald-400 font-mono">{Math.round(result.data.progress_percentage || 0)}%</span>
                                        </div>
                                        {Array.isArray(result.data.lessons) && (
                                            <div>
                                                <span className="text-slate-400">{t('Lessons Count:', 'عدد المحاضرات:')} </span>
                                                <span className="font-bold text-indigo-300 font-mono">{result.data.lessons.length}</span>
                                            </div>
                                        )}
                                        {result.data.url && (
                                            <a
                                                href={result.data.url}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold ms-auto"
                                            >
                                                <span>{t('Original Course Link', 'رابط الكورس الأصلي')}</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Lessons Syllabus with Search */}
                                <div className="p-6 sm:p-8 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-indigo-400" />
                                            <h2 className="text-base font-bold text-white">{t('Curriculum & Lessons', 'فهرس المحاضرات والمحتوى')}</h2>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                                {filteredLessons.length}
                                            </span>
                                        </div>

                                        <div className="relative min-w-[220px]">
                                            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                value={lessonSearch}
                                                onChange={(e) => setLessonSearch(e.target.value)}
                                                placeholder={t('Search in lessons...', 'بحث في المحاضرات...')}
                                                className="w-full text-xs bg-slate-800/80 border border-slate-700 rounded-xl ps-8 pe-3 py-1.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    {filteredLessons.length > 0 ? (
                                        <div className="space-y-3">
                                            {filteredLessons.map((lesson, idx) => (
                                                <div
                                                    key={lesson.id || idx}
                                                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition space-y-2.5"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center">
                                                                {lesson.lesson_number || idx + 1}
                                                            </span>
                                                            <h3 className="text-sm font-bold text-white">
                                                                {lesson.title}
                                                            </h3>
                                                        </div>
                                                        {lesson.duration_minutes && (
                                                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                                                                <Clock className="w-3 h-3" />
                                                                {lesson.duration_minutes} {t('min', 'دقيقة')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {lesson.summary && (
                                                        <p className="text-xs text-slate-300 leading-relaxed ps-10 whitespace-pre-wrap">
                                                            {lesson.summary}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                                            {t('No lessons matching your search query.', 'لم يتم العثور على محاضرات تطابق معايير البحث.')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* VIEW 3: Structured Lesson / Custom Entity View */
                        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 flex-1 space-y-6 animate-in fade-in duration-200">
                            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl overflow-hidden shadow-2xl divide-y divide-slate-800/80">
                                <div className="p-6 sm:p-8 bg-slate-900/40 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] font-semibold text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 uppercase">
                                            {result.entityType}
                                        </span>
                                        {result.data.lesson_number && (
                                            <span className="text-[11px] text-slate-300 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-mono">
                                                {t('Lesson #', 'المحاضرة رقم:')} {result.data.lesson_number}
                                            </span>
                                        )}
                                        {result.data.duration_minutes && (
                                            <span className="text-[11px] text-slate-300 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-1 font-mono">
                                                <Clock className="w-3 h-3" />
                                                {result.data.duration_minutes} {t('min', 'دقيقة')}
                                            </span>
                                        )}
                                    </div>

                                    <h1 className="text-2xl font-black text-white">
                                        {result.data.title || result.data.name || t('Shared Content', 'محتوى مشارك')}
                                    </h1>

                                    {result.data.description && (
                                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {result.data.description}
                                        </p>
                                    )}
                                </div>

                                <div className="p-6 sm:p-8 space-y-6">
                                    {result.data.summary && (
                                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>{t('Lesson Summary', 'ملخص المحاضرة')}</span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                                                {result.data.summary}
                                            </p>
                                        </div>
                                    )}

                                    {result.data.content && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                {t('Lecture Content & Explanation:', 'محتوى وشرح المحاضرة:')}
                                            </span>
                                            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                                                {result.data.content}
                                            </div>
                                        </div>
                                    )}

                                    {Array.isArray(result.data.resources) && result.data.resources.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-slate-800">
                                            <span className="text-xs font-bold text-white flex items-center gap-2">
                                                <FolderTree className="w-4 h-4 text-indigo-400" />
                                                <span>{t('Attached Resources & References:', 'المصادر والمراجع المرفقة:')}</span>
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {result.data.resources.map(res => (
                                                    <a
                                                        key={res.id}
                                                        href={res.url || '#'}
                                                        target="_blank"
                                                        rel="noreferrer noopener"
                                                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 flex items-center justify-between text-xs transition"
                                                    >
                                                        <span className="font-semibold text-slate-200 truncate">{res.title}</span>
                                                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : null}
            </main>

            {/* Bottom Subtle Information Footer */}
            <footer className="border-t border-zinc-800/80 bg-[#09090b] py-3 px-4 sm:px-6 text-xs text-zinc-400">
                <div className="w-full max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[11.5px]">
                            {t(
                                'Secure isolated read-only view — record is automatically deleted from database upon timeout.',
                                'محتوى معزول وآمن للقراءة فقط — يُحذف السجل بالكامل تلقائياً من قاعدة البيانات عند انتهاء وقته.'
                            )}
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                        Orbit Temporary Share Engine v2
                    </span>
                </div>
            </footer>
        </div>
    );
}
