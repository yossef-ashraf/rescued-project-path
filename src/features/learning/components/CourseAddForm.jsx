'use client';

import React, { useState, useEffect } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import {
    ArrowLeft,
    BookOpen,
    Link2,
    Layers,
    Calendar,
    CheckCircle2,
    Loader2,
    AlertCircle,
    FileText,
    ExternalLink,
    Unlink,
    Plus
} from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import { fetchCourseCategoriesAndMaterials, createCourse } from '@/features/learning/api/addCourse.api.js';
import { Button } from '@/components/ui/button';

export default function CourseAddForm() {
    const { t, setActiveDashboard } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const parentIdParam = searchParams.get('parent_id') || 'none';

    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [linkedMaterials, setLinkedMaterials] = useState([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        title: '',
        url: '',
        total_units: 1,
        completed_units: 0,
        status: 'In Progress',
        expected_start_date: new Date().toISOString().split('T')[0],
        expected_end_date: '',
        parent_id: parentIdParam,
        description: '',
        include_in_stats: true
    });

    useEffect(() => {
        queueMicrotask(() => setActiveDashboard('courses'));
        fetchCourseCategoriesAndMaterials()
            .then(({ categories: cats, allMaterials: mats }) => {
                setCategories(Array.isArray(cats) ? cats : []);
                setAllMaterials(Array.isArray(mats) ? mats : []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setCategoriesLoading(false);
            });
    }, [setActiveDashboard]);

    const handleQueueMaterial = () => {
        if (!selectedMaterialId) return;
        const target = allMaterials.find(m => String(m.id) === String(selectedMaterialId));
        if (target) {
            setLinkedMaterials(prev => [target, ...prev.filter(m => String(m.id) !== String(selectedMaterialId))]);
            setSelectedMaterialId('');
            announceMatteAlert({
                tone: 'info',
                title: t('Material Queued', 'تمت إضافة المادة للربط'),
                description: target.file_name
            });
        }
    };

    const handleRemoveQueuedMaterial = (fileId) => {
        setLinkedMaterials(prev => prev.filter(m => String(m.id) !== String(fileId)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const cleanTitle = form.title.trim();
        if (!cleanTitle) {
            const msg = t('Please enter a course title.', 'يرجى إدخال عنوان الكورس.');
            setErrorMsg(msg);
            announceMatteAlert({ tone: 'warning', title: t('Missing Title', 'العنوان مطلوب'), description: msg });
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            const totalUnits = Math.max(1, parseInt(form.total_units, 10) || 1);
            const completedUnits = Math.min(totalUnits, Math.max(0, parseInt(form.completed_units, 10) || 0));
            const body = {
                action: 'create',
                type: 'course',
                title: cleanTitle,
                url: form.url ? form.url.trim() : null,
                total_units: totalUnits,
                completed_units: completedUnits,
                status: form.status,
                expected_start_date: form.expected_start_date || null,
                expected_end_date: form.expected_end_date || null,
                parent_id: (form.parent_id === 'none' || form.parent_id === '') ? null : parseInt(form.parent_id, 10),
                description: form.description ? form.description.trim() : null,
                include_in_stats: form.include_in_stats ? 1 : 0,
                linked_material_ids: linkedMaterials.map(m => m.id)
            };

            const res = await createCourse(body);
            if (res && (res.ok || res.id || res.success)) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Course Created', 'تم إنشاء الكورس بنجاح'),
                    description: cleanTitle
                });
                router.push('/courses/hierarchy');
                router.refresh();
            } else {
                const failReason = res?.error || t('Failed to create course. Please try again.', 'فشل إنشاء الكورس. يرجى المحاولة مرة أخرى.');
                setErrorMsg(failReason);
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Creation Failed', 'فشل الإنشاء'),
                    description: failReason
                });
            }
        } catch (err) {
            const failReason = err?.message || t('An unexpected error occurred.', 'حدث خطأ غير متوقع.');
            setErrorMsg(failReason);
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: failReason
            });
        } finally {
            setLoading(false);
        }
    };

    const availableMaterials = allMaterials.filter(
        m => !linkedMaterials.some(lm => String(lm.id) === String(m.id))
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16 pt-2">
            <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                {loading && (
                    <div className="md-progress-track mb-4 rounded-full">
                        <div className="md-progress-bar" />
                    </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                {t('Add New Course or Link', 'إضافة كورس أو رابط جديد')}
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                {t('Track units, learning schedule, analytics inclusion, and linked study materials.', 'تتبع الوحدات، جدول التعلم، الإحصائيات، والمذكرات المرتبطة.')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                        title={t('Back', 'رجوع')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Course Title', 'عنوان الكورس')} <span className="text-red-500 font-semibold ms-1">({t('Required', 'مطلوب')} *)</span>
                            </label>
                            <input
                                type="text"
                                required
                                autoFocus
                                disabled={loading}
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                                placeholder={t('e.g. Next.js Masterclass', 'مثال: دورة Next.js المتقدمة')}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('URL / Link', 'الرابط')}
                            </label>
                            <div className="flex items-center min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 overflow-hidden focus-within:border-[#BC5C29] transition">
                                <span className="px-3.5 py-2.5 inline-flex items-center text-xs font-mono font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 select-none">
                                    https://
                                </span>
                                <input
                                    type="text"
                                    disabled={loading}
                                    title={form.url || ''}
                                    value={form.url ? form.url.replace(/^https?:\/\//i, '') : ''}
                                    onChange={e => {
                                        const val = e.target.value.trim().replace(/^https?:\/\//i, '');
                                        setForm({ ...form, url: val ? `https://${val}` : '' });
                                    }}
                                    className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none disabled:opacity-60 border-0!"
                                    placeholder="youtube.com/... or coursera.org/..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Parent Category', 'التصنيف الأب')}
                            </label>
                            <select
                                disabled={loading || categoriesLoading}
                                value={form.parent_id}
                                onChange={e => setForm({ ...form, parent_id: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            >
                                <option value="none">{t('None (Root Level)', 'بدون (المستوى الرئيسي)')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Status', 'الحالة')}
                            </label>
                            <select
                                disabled={loading}
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            >
                                <option value="In Progress">{t('In Progress', 'قيد التقدم')}</option>
                                <option value="Completed">{t('Completed', 'مكتمل')}</option>
                                <option value="Overdue">{t('Overdue', 'متأخر')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Total Units', 'الوحدات الكلية')}
                            </label>
                            <input
                                type="number"
                                min="1"
                                disabled={loading}
                                value={form.total_units}
                                onChange={e => setForm({ ...form, total_units: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Completed Units', 'الوحدات المنجزة')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={form.total_units || 1}
                                disabled={loading}
                                value={form.completed_units}
                                onChange={e => setForm({ ...form, completed_units: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-semibold tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {t('Expected Start', 'تاريخ البدء المتوقع')}
                                </label>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setForm({ ...form, expected_start_date: new Date().toISOString().split('T')[0] })}
                                    className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                >
                                    {t('Today', 'اليوم')}
                                </button>
                            </div>
                            <input
                                type="date"
                                disabled={loading}
                                value={form.expected_start_date}
                                onChange={e => setForm({ ...form, expected_start_date: e.target.value })}
                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {t('Expected End', 'تاريخ الانتهاء المتوقع')}
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + 7);
                                            setForm({ ...form, expected_end_date: d.toISOString().split('T')[0] });
                                        }}
                                        className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                    >
                                        +1w
                                    </button>
                                    <span className="text-zinc-400">•</span>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => {
                                            const d = new Date();
                                            const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                                            setForm({ ...form, expected_end_date: lastDay.toISOString().split('T')[0] });
                                        }}
                                        className="text-[11px] font-semibold text-[#BC5C29] hover:underline cursor-pointer"
                                    >
                                        {t('Month End', 'نهاية الشهر')}
                                    </button>
                                </div>
                            </div>
                            <input
                                type="date"
                                disabled={loading}
                                value={form.expected_end_date}
                                onChange={e => setForm({ ...form, expected_end_date: e.target.value })}
                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium tabular-nums text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t('Description & Overview', 'الوصف والنبذة التعريفية')}
                            </label>
                            <textarea
                                rows={3}
                                disabled={loading}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition resize-y"
                                placeholder={t('Enter comprehensive description or learning objectives...', 'أدخل وصفاً تفصيلياً أو نبذة عن محتوى وأهداف هذا المساق...')}
                            />
                        </div>

                        <div className="md:col-span-2 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                        {t('Include in Statistics & Analytics', 'تضمين في الإحصائيات والتقارير')}
                                    </span>
                                    <span
                                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${form.include_in_stats
                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                            : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 border border-zinc-300 dark:border-zinc-700'
                                            }`}
                                    >
                                        {form.include_in_stats ? t('Active in Stats', 'مُحتسب في الإحصائيات') : t('Excluded', 'مُستبعد')}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {t(
                                        'Whether this course and its units count towards overall completion rate, video hours, and PDF reports.',
                                        'تحديد ما إذا كان هذا الكورس ووحداته تُحتسب ضمن نسب الإنجاز ولوحة الإحصائيات وتقرير الـ PDF.'
                                    )}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    disabled={loading}
                                    checked={form.include_in_stats}
                                    onChange={e => setForm({ ...form, include_in_stats: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BC5C29] peer-checked:border-[#BC5C29]" />
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-line pt-4 mt-5 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="secondary" size="default" disabled={loading} onClick={() => router.back()} className="cursor-pointer">
                            {t('Cancel', 'إلغاء')}
                        </Button>
                        <Button type="submit" variant="default" size="default" disabled={loading} loading={loading} className="cursor-pointer">
                            <span>{loading ? t('Creating Course...', 'جاري إنشاء الكورس...') : t('Create Course', 'إنشاء الكورس')}</span>
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                                    {t('Linked Materials & Resources', 'المواد والمذكرات المرتبطة')}
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 tabular-nums">
                                    {linkedMaterials.length}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {t(
                                    'Link study files, PDFs, and notes to this course or manage existing attachments',
                                    'ربط ملفات ومذكرات وروابط خارجية بهذا الكورس ليتم حفظها معه تلقائياً'
                                )}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/courses/materials"
                        className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5 shrink-0 transition"
                    >
                        <span>{t('Browse All Materials', 'تصفح كل المذكرات')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {t('Link an existing material from library:', 'اختر مادة من المكتبة لربطها بهذا الكورس:')}
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                        <select
                            disabled={loading || categoriesLoading}
                            value={selectedMaterialId}
                            onChange={e => setSelectedMaterialId(e.target.value)}
                            className="flex-1 min-w-0 w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] truncate"
                        >
                            <option value="">-- {t('Choose material to link...', 'اختر مادة لربطها...')} --</option>
                            {availableMaterials.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.file_name} {m.category_name ? `[${m.category_name}]` : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleQueueMaterial}
                            disabled={!selectedMaterialId || loading}
                            className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t('Link to Course', 'ربط بالكورس')}</span>
                        </button>
                    </div>
                </div>

                {linkedMaterials.length === 0 ? (
                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-6 text-center transition bg-zinc-50/40 dark:bg-zinc-900/30">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2.5 text-zinc-600 dark:text-zinc-300">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                            {t('No materials currently linked to this course', 'لا توجد مواد مرتبطة بهذا الكورس حالياً')}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {t('Select a material from the dropdown above to link it directly', 'اختر مادة من القائمة أعلاه لربطها بهذا الكورس مباشرة')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {linkedMaterials.map(mat => (
                            <div
                                key={mat.id}
                                className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-3 hover:border-[#BC5C29]/40 transition"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                                            {mat.file_name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {mat.category_name && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono">
                                                    {mat.category_name}
                                                </span>
                                            )}
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#BC5C29]/15 text-[#BC5C29]">
                                                {t('Queued to link on save', 'سيتم ربطها عند حفظ الكورس')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {mat.file_url && (
                                        <a
                                            href={mat.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                                            title={t('Open / View', 'فتح ومعاينة')}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQueuedMaterial(mat.id)}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                                        title={t('Remove', 'إلغاء الربط')}
                                    >
                                        <Unlink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

