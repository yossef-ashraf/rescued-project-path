'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from '@/shared/next-compat/navigation';
import { ArrowLeft, Folder, Layers, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import { fetchCourseCategories, createCategory } from '@/features/learning/api/addCategory.api.js';
import { Button } from '@/components/ui/button';

export default function CategoryAddForm() {
    const { t, setActiveDashboard } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const parentIdParam = searchParams.get('parent_id') || 'none';

    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        title: '',
        parent_id: parentIdParam,
        description: ''
    });

    useEffect(() => {
        queueMicrotask(() => setActiveDashboard('courses'));
        fetchCourseCategories()
            .then(cats => {
                setCategories(Array.isArray(cats) ? cats : []);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setCategoriesLoading(false);
            });
    }, [setActiveDashboard]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const cleanTitle = form.title.trim();
        if (!cleanTitle) {
            const msg = t('Please enter a category title.', 'يرجى إدخال عنوان التصنيف.');
            setErrorMsg(msg);
            announceMatteAlert({ tone: 'warning', title: t('Missing Title', 'العنوان مطلوب'), description: msg });
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            const body = {
                action: 'create',
                type: 'category',
                title: cleanTitle,
                parent_id: (form.parent_id === 'none' || form.parent_id === '') ? null : parseInt(form.parent_id, 10),
                description: form.description ? form.description.trim() : null
            };

            const res = await createCategory(body);
            if (res && (res.ok || res.id || res.success)) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Category Created', 'تم إنشاء التصنيف بنجاح'),
                    description: cleanTitle
                });
                router.push('/courses/hierarchy');
                router.refresh();
            } else {
                const failReason = res?.error || t('Failed to create category. Please try again.', 'فشل إنشاء التصنيف. يرجى المحاولة مرة أخرى.');
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

    return (
        <div className="max-w-xl mx-auto space-y-5 animate-fade-in pb-16 pt-2">
            <div className="relative bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
                {loading && (
                    <div className="md-progress-track mb-4 rounded-full">
                        <div className="md-progress-bar" />
                    </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                            <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                {t('Add New Category', 'إضافة تصنيف جديد')}
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                {t('Organize your courses into structured folders and tracks.', 'نظم الكورسات داخل مجلدات ومسارات تعليمية.')}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMsg && (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                            {t('Category Title', 'عنوان التصنيف')} <span className="text-red-500 font-semibold ms-1">({t('Required', 'مطلوب')} *)</span>
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            disabled={loading}
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full min-h-[48px] sm:min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                            placeholder={t('e.g. Web Development', 'مثال: تطوير الويب')}
                        />
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
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                            {t('Select None to make this a main root category.', 'اختر بدون ليكون تصنيفاً رئيسياً.')}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                            {t('Description (Optional)', 'الوصف (اختياري)')}
                        </label>
                        <textarea
                            rows={3}
                            disabled={loading}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition resize-none"
                            placeholder={t('Optional notes about this learning track...', 'ملاحظات اختيارية حول هذا المسار...')}
                        />
                    </div>

                    <div className="border-t border-line pt-4 mt-5 flex items-center justify-end gap-2.5">
                        <Button type="button" variant="secondary" size="default" disabled={loading} onClick={() => router.back()} className="cursor-pointer">
                            {t('Cancel', 'إلغاء')}
                        </Button>
                        <Button type="submit" variant="default" size="default" disabled={loading} loading={loading} className="cursor-pointer">
                            <span>{loading ? t('Creating Category...', 'جاري إنشاء التصنيف...') : t('Create Category', 'إنشاء التصنيف')}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
