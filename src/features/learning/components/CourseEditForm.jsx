'use client';

import React, { useState, useEffect, use } from 'react';
import Link from '@/shared/next-compat/link';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import {
    ArrowLeft,
    FileText,
    BookOpen,
    ExternalLink,
    Unlink,
    Plus,
    CheckCircle2,
    Loader2,
    Layers,
    Link2,
    Calendar,
    Sparkles
} from 'lucide-react';
import { FormSkeleton } from '@/components/ui/Skeleton';
import { fetchCourseAndCategories, updateCourseOrCategory, linkMaterialToCourse } from '@/features/learning/api/editCourse.api.js';
import { Button } from '@/components/ui/button';

export default function EditCourseOrCategoryPage({ params }) {
    const { id } = use(params);
    const { t, setActiveDashboard } = useApp();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState([]);
    const [itemType, setItemType] = useState('course');
    const [linkedMaterials, setLinkedMaterials] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [linkingMaterial, setLinkingMaterial] = useState(false);
    const [unlinkTarget, setUnlinkTarget] = useState(null);
    const [isUnlinking, setIsUnlinking] = useState(false);

    const [form, setForm] = useState({
        title: '',
        url: '',
        total_units: 1,
        completed_units: 0,
        status: 'In Progress',
        expected_start_date: '',
        expected_end_date: '',
        parent_id: 'none',
        description: '',
        include_in_stats: true
    });

    useEffect(() => {
        setActiveDashboard('courses');

        fetchCourseAndCategories(id)
            .then(({ categories: cats, currentItem, linkedMaterials: lm, allMaterials: am }) => {
                setCategories(cats || []);
                setLinkedMaterials(lm || []);
                setAllMaterials(am || []);
                if (currentItem) {
                    setItemType(currentItem.type || 'course');
                    const isInc = currentItem.include_in_stats === 0 || currentItem.include_in_stats === '0' || currentItem.include_in_stats === false ? false : true;
                    const normStatus = (currentItem.status?.toLowerCase() === 'completed' || Number(currentItem.progress_percentage) >= 100)
                        ? 'Completed'
                        : (currentItem.status?.toLowerCase() === 'overdue')
                            ? 'Overdue'
                            : 'In Progress';
                    setForm({
                        title: currentItem.title || '',
                        url: currentItem.url || '',
                        total_units: currentItem.total_units || 1,
                        completed_units: currentItem.completed_units || 0,
                        status: normStatus,
                        expected_start_date: currentItem.expected_start_date ? String(currentItem.expected_start_date).split('T')[0] : '',
                        expected_end_date: currentItem.expected_end_date ? String(currentItem.expected_end_date).split('T')[0] : '',
                        parent_id: currentItem.parent_id || 'none',
                        description: currentItem.description || '',
                        include_in_stats: isInc
                    });
                }
                setFetching(false);
            })
            .catch(err => {
                console.error(err);
                setFetching(false);
            });
    }, [id, setActiveDashboard]);

    const handleLinkMaterial = async () => {
        if (!selectedMaterialId || linkingMaterial) return;
        setLinkingMaterial(true);
        try {
            const res = await linkMaterialToCourse(selectedMaterialId, id);
            if (res.ok) {
                const target = allMaterials.find(m => String(m.id) === String(selectedMaterialId));
                if (target) {
                    setLinkedMaterials(prev => [{ ...target, course_id: id }, ...prev.filter(m => String(m.id) !== String(selectedMaterialId))]);
                }
                setSelectedMaterialId('');
                announceMatteAlert({
                    tone: 'success',
                    title: t('Material Linked', 'تم ربط المادة بالكورس'),
                    description: target?.file_name || ''
                });
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Link Failed', 'فشل ربط المادة'),
                    description: t('Could not link material to this course.', 'تعذر ربط المادة بهذا الكورس.')
                });
            }
        } catch (err) {
            console.error('Failed to link material:', err);
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to link material.', 'فشل ربط المادة.')
            });
        } finally {
            setLinkingMaterial(false);
        }
    };

    const handleUnlinkMaterial = (fileId) => {
        setUnlinkTarget(fileId);
    };

    const confirmUnlinkMaterial = async () => {
        if (!unlinkTarget || isUnlinking) return;
        setIsUnlinking(true);
        try {
            const res = await linkMaterialToCourse(unlinkTarget, null);
            if (res.ok) {
                setLinkedMaterials(prev => prev.filter(m => String(m.id) !== String(unlinkTarget)));
                announceMatteAlert({
                    tone: 'info',
                    title: t('Material Unlinked', 'تم إلغاء ربط المادة')
                });
            }
        } catch (err) {
            console.error('Failed to unlink material:', err);
        } finally {
            setUnlinkTarget(null);
            setIsUnlinking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            const body = {
                action: 'update',
                id: id,
                type: itemType,
                title: form.title,
                url: form.url,
                total_units: parseInt(form.total_units, 10) || 1,
                completed_units: parseInt(form.completed_units, 10) || 0,
                status: form.status,
                expected_start_date: form.expected_start_date || null,
                expected_end_date: form.expected_end_date || null,
                parent_id: (form.parent_id === 'none' || form.parent_id === '') ? null : form.parent_id,
                description: form.description || null,
                include_in_stats: form.include_in_stats ? 1 : 0
            };

            const res = await updateCourseOrCategory(body);
            if (res.ok) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Saved Successfully', 'تم حفظ التعديلات بنجاح'),
                    description: form.title
                });
                const searchParams = new URLSearchParams(window.location.search);
                const returnTo = searchParams.get('returnTo');
                if (returnTo) {
                    router.push(returnTo);
                } else {
                    router.push('/courses/hierarchy');
                }
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Save failed', 'فشل الحفظ'),
                    description: errData.error || t('Failed to save changes', 'فشل حفظ التعديلات')
                });
            }
        } catch (err) {
            console.error(err);
            announceMatteAlert({
                tone: 'danger',
                title: t('Unexpected error', 'خطأ غير متوقع'),
                description: t('An unexpected error occurred while saving', 'حدث خطأ غير متوقع أثناء الحفظ')
            });
        } finally {
            setLoading(false);
        }
    };

    const setupProgress = React.useMemo(() => {
        if (itemType !== 'course') return 100;
        let score = 0;
        if (form.title?.trim()) score += 25;
        if (form.parent_id && form.parent_id !== 'none') score += 20;
        if (form.url?.trim()) score += 15;
        if (form.description?.trim()) score += 20;
        if (form.status) score += 10;
        if (linkedMaterials.length > 0) score += 10;
        return Math.min(100, score);
    }, [itemType, form.title, form.parent_id, form.url, form.description, form.status, linkedMaterials.length]);

    if (fetching) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <FormSkeleton />
            </div>
        );
    }

    const handleBack = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const returnTo = searchParams.get('returnTo');
        if (returnTo) {
            router.push(returnTo);
        } else {
            router.back();
        }
    };

    const availableMaterials = allMaterials.filter(
        m => !linkedMaterials.some(lm => String(lm.id) === String(m.id))
    );

    return (
        <div className={`max-w-${itemType === 'course' ? '3xl' : '2xl'} mx-auto space-y-5 animate-fade-in pb-16`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={handleBack}
                        title={t('Back', 'رجوع')}
                        className="cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="orbit-h1 text-[24px] sm:text-[28px] font-bold tracking-tight text-ink">
                            {t('Edit Details', 'تعديل التفاصيل')}
                        </h1>
                        <p className="text-[12.5px] text-muted">
                            {itemType === 'course'
                                ? t('Update course progress, dates, statistics inclusion, and linked materials.', 'تحديث تقدم الكورس، المواعيد، التضمين في الإحصائيات، والمذكرات المرتبطة.')
                                : t('Update category title, hierarchy, and description.', 'تحديث اسم التصنيف، التسلسل الهرمي، والوصف.')}
                        </p>
                    </div>
                </div>

                {itemType === 'course' && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary">
                            {form.status}
                        </span>
                    </div>
                )}
            </div>

            {itemType === 'course' && (
                <div className="p-4 rounded-2xl border border-line bg-surface space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            {t("Course Setup Completion", "اكتمال إعداد وتجهيز الكورس")}
                        </span>
                        <span className="font-bold text-primary tabular-nums">{setupProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surfaceMuted overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${setupProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="relative bg-surface rounded-2xl border border-line shadow-card overflow-hidden">
                {loading && (
                    <div className="md-progress-track">
                        <div className="md-progress-bar" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className={itemType === 'course' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                        <div className={itemType === 'course' ? 'md:col-span-2' : ''}>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                {t('Title', 'العنوان')}
                                <span className="text-crit font-semibold ms-1">({t('Required', 'مطلوب')} *)</span>
                            </label>
                            <input
                                type="text"
                                required
                                disabled={loading}
                                title={form.title}
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3.5 rounded-xl text-[13.5px] font-medium text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                            />
                        </div>

                        <div className={itemType === 'course' ? 'md:col-span-2' : ''}>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                <Layers className="w-3.5 h-3.5 text-muted" />
                                {t('Parent Category', 'التصنيف الأب')}
                            </label>
                            <select
                                disabled={loading}
                                title={categories.find(c => String(c.id) === String(form.parent_id))?.title || ''}
                                value={form.parent_id}
                                onChange={e => setForm({ ...form, parent_id: e.target.value })}
                                className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3 rounded-xl text-[13.5px] font-medium text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                            >
                                <option value="none">{t('None (Root Level)', 'بدون (المستوى الرئيسي)')}</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                                ))}
                            </select>
                        </div>

                        {itemType === 'course' && (
                            <>
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                        <Link2 className="w-3.5 h-3.5 text-muted" />
                                        {t('URL / Link', 'الرابط')}
                                    </label>
                                    <input
                                        type="url"
                                        disabled={loading}
                                        title={form.url}
                                        value={form.url}
                                        onChange={e => setForm({ ...form, url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3.5 rounded-xl text-[13.5px] font-medium text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-muted" />
                                        {t('Status', 'الحالة')}
                                    </label>
                                    <select
                                        disabled={loading}
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3 rounded-xl text-[13.5px] font-medium text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    >
                                        <option value="In Progress">{t('In Progress', 'قيد التقدم')}</option>
                                        <option value="Completed">{t('Completed', 'مكتمل')}</option>
                                        <option value="Overdue">{t('Overdue', 'متأخر')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[13px] font-semibold text-ink2">
                                        {t('Total Units', 'الوحدات الكلية')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={loading}
                                        value={form.total_units}
                                        onChange={e => setForm({ ...form, total_units: e.target.value })}
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3.5 rounded-xl text-[13.5px] font-semibold tabular-nums text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-[13px] font-semibold text-ink2">
                                        {t('Completed Units', 'الوحدات المنجزة')}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={form.total_units}
                                        disabled={loading}
                                        value={form.completed_units}
                                        onChange={e => setForm({ ...form, completed_units: e.target.value })}
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3.5 rounded-xl text-[13.5px] font-semibold tabular-nums text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                        <Calendar className="w-3.5 h-3.5 text-muted" />
                                        {t('Expected Start', 'تاريخ البدء المتوقع')}
                                    </label>
                                    <input
                                        type="date"
                                        disabled={loading}
                                        value={form.expected_start_date}
                                        onChange={e => setForm({ ...form, expected_start_date: e.target.value })}
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3 rounded-xl text-[13px] font-medium tabular-nums text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink2">
                                        <Calendar className="w-3.5 h-3.5 text-muted" />
                                        {t('Expected End', 'تاريخ الانتهاء المتوقع')}
                                    </label>
                                    <input
                                        type="date"
                                        disabled={loading}
                                        value={form.expected_end_date}
                                        onChange={e => setForm({ ...form, expected_end_date: e.target.value })}
                                        className="w-full min-h-[48px] sm:min-h-[44px] bg-matte border border-line px-3 rounded-xl text-[13px] font-medium tabular-nums text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition"
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-[13px] font-semibold text-ink2">
                                {t('Description & Overview', 'الوصف والنبذة التعريفية')}
                            </label>
                            <textarea
                                rows={3}
                                disabled={loading}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder={t('Enter comprehensive description or learning objectives...', 'أدخل وصفاً تفصيلياً أو نبذة عن محتوى وأهداف هذا المساق...')}
                                className="w-full bg-matte border border-line p-3 rounded-md text-[13px] font-medium text-ink placeholder:text-faint focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 leading-relaxed resize-y transition"
                            />
                        </div>

                        <div className="md:col-span-2 p-4 rounded-xl border border-line bg-matte flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[12.5px] font-semibold text-ink uppercase tracking-wider">
                                        {t('Include in Statistics & Analytics', 'تضمين في الإحصائيات والتقارير')}
                                    </span>
                                    <span
                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${form.include_in_stats
                                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                                            : 'bg-line2 text-muted border border-line'
                                            }`}
                                    >
                                        {form.include_in_stats ? t('Active in Stats', 'مُحتسب في الإحصائيات') : t('Excluded', 'مُستبعد')}
                                    </span>
                                </div>
                                <p className="text-[12px] text-muted mt-1 leading-relaxed">
                                    {t(
                                        'Whether this course and its units count towards overall completion rate, video hours, and PDF reports.',
                                        'تحديد ما إذا كان هذا الكورس ووحداته تُحتسب ضمن نسب الإحصائيات وتقرير الـ PDF.'
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
                                <div className="w-11 h-6 bg-line2 border border-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:border-primary" />
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
                        <Button type="button" variant="secondary" size="default" disabled={loading} onClick={handleBack} className="cursor-pointer">
                            {t('Cancel', 'إلغاء')}
                        </Button>
                        <Button type="submit" variant="default" size="default" disabled={loading} loading={loading} className="cursor-pointer">
                            <span>{loading ? t('Saving Changes...', 'جاري حفظ التعديلات...') : t('Save Changes', 'حفظ التعديلات')}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {itemType === 'course' && (
                <div className="relative bg-surface rounded-xl border border-line p-6 shadow-card space-y-5 overflow-hidden">
                    {(linkingMaterial || isUnlinking) && (
                        <div className="md-progress-track">
                            <div className="md-progress-bar" />
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary-wash text-primary-strong flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[15px] font-semibold text-ink truncate">
                                        {t('Linked Materials & Resources', 'المواد والمذكرات المرتبطة')}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary-wash text-primary-strong border border-primary/25 tabular-nums">
                                        {linkedMaterials.length}
                                    </span>
                                </div>
                                <p className="text-[12px] text-muted mt-0.5">
                                    {t(
                                        'Link study files, PDFs, and notes to this course or manage existing attachments',
                                        'ربط ملفات ومذكرات وروابط خارجية بهذا الكورس وإدارتها'
                                    )}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/courses/materials"
                            className="text-[12.5px] font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                        >
                            <span>{t('Browse All Materials', 'تصفح كل المذكرات')}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="p-4 rounded-xl bg-matte border border-line space-y-2.5">
                        <label className="block text-[12.5px] font-semibold text-ink2">
                            {t('Link an existing material from library:', 'اختر مادة من المكتبة لربطها بهذا الكورس:')}
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full min-w-0">
                            <select
                                disabled={linkingMaterial}
                                value={selectedMaterialId}
                                onChange={e => setSelectedMaterialId(e.target.value)}
                                className="flex-1 min-w-0 w-full h-9 bg-surface border border-line px-3 rounded-md text-[13px] font-medium text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 truncate disabled:opacity-60"
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
                                onClick={handleLinkMaterial}
                                disabled={!selectedMaterialId || linkingMaterial}
                                className="h-9 px-4 rounded-md bg-primary hover:bg-primary-strong disabled:opacity-50 text-on-primary text-[13px] font-semibold transition inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                            >
                                {linkingMaterial ? (
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                ) : (
                                    <Plus className="w-4 h-4 shrink-0" />
                                )}
                                <span>{linkingMaterial ? t('Linking...', 'جاري الربط...') : t('Link to Course', 'ربط بالكورس')}</span>
                            </button>
                        </div>
                    </div>

                    {linkedMaterials.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-line bg-matte/40 text-muted">
                            <BookOpen className="w-7 h-7 mx-auto mb-2 opacity-50" />
                            <p className="text-[13px] font-semibold text-ink2">
                                {t('No materials currently linked to this course', 'لا توجد مواد مرتبطة بهذا الكورس حالياً')}
                            </p>
                            <p className="text-[12px] text-muted mt-1">
                                {t('Select a material from the dropdown above to link it directly', 'اختر مادة من القائمة أعلاه لربطها بهذا الكورس مباشرة')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {linkedMaterials.map(mat => (
                                <div
                                    key={mat.id}
                                    className="p-3.5 rounded-lg border border-line bg-matte flex items-center justify-between gap-3 hover:border-primary/40 transition"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 rounded-md bg-surface border border-line text-muted shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-[13px] text-ink truncate">
                                                {mat.file_name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {mat.category_name && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded bg-surface border border-line text-muted font-mono">
                                                        {mat.category_name}
                                                    </span>
                                                )}
                                                <span
                                                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${mat.reading_status === 'read' || mat.reading_status === 'completed'
                                                        ? 'bg-emerald-500/15 text-emerald-500'
                                                        : mat.reading_status === 'in_progress'
                                                            ? 'bg-amber-500/15 text-amber-500'
                                                            : 'bg-surface border border-line text-muted'
                                                        }`}
                                                >
                                                    <span>
                                                        {mat.reading_status === 'read' || mat.reading_status === 'completed'
                                                            ? '🟢'
                                                            : mat.reading_status === 'in_progress'
                                                                ? '🟡'
                                                                : '⚪'}
                                                    </span>
                                                    <span>
                                                        {mat.reading_status === 'read' || mat.reading_status === 'completed'
                                                            ? t('Read', 'خلصت')
                                                            : mat.reading_status === 'in_progress'
                                                                ? t('In Progress', 'مخلصتش')
                                                                : t('Unread', 'مقراتش')}
                                                    </span>
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
                                                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-line bg-surface hover:bg-line2 text-ink2 transition cursor-pointer"
                                                title={t('Open / View', 'فتح ومعاينة')}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isUnlinking && String(unlinkTarget) === String(mat.id)}
                                            onClick={() => handleUnlinkMaterial(mat.id)}
                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-crit hover:bg-crit/10 transition cursor-pointer disabled:opacity-50"
                                            title={t('Unlink from course', 'إلغاء الربط من الكورس')}
                                        >
                                            {isUnlinking && String(unlinkTarget) === String(mat.id) ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Unlink className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!unlinkTarget}
                onClose={() => setUnlinkTarget(null)}
                onConfirm={confirmUnlinkMaterial}
                title={t('Unlink material', 'تأكيد إلغاء ربط المادة')}
                message={t('This material will be unlinked from the course.', 'سيتم إلغاء ربط هذه المادة من الكورس.')}
                confirmText={t('Unlink', 'إلغاء الربط')}
                isDeleting={isUnlinking}
            />
        </div>
    );
}

