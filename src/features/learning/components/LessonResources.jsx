'use client';

import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, ExternalLink, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/shared/context/AppContext.jsx';

export function LessonResources({ resources = [], onAdd, onDelete, contentDir = 'rtl' }) {
    const { t, lang } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [resourceType, setResourceType] = useState('book');

    const resourceTypes = [
        { value: 'book', label: t("Book / Reference", "كتاب / مرجع") },
        { value: 'article', label: t("Article / Paper", "مقال / ورقة بحثية") },
        { value: 'video', label: t("Video", "فيديو") },
        { value: 'link', label: t("External Link", "رابط خارجي") },
        { value: 'tool', label: t("Interactive Tool", "أداة تفاعلية") }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;
        if (onAdd) {
            await onAdd({ title, url, description, resource_type: resourceType });
            setTitle('');
            setUrl('');
            setDescription('');
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-3 p-4 bg-surface rounded-2xl border border-line shadow-2xs" dir={contentDir}>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span>{t("Books & References", "الكتب والمراجع المذكورة")} ({resources.length})</span>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAdding(!isAdding)}
                    className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer rounded-lg"
                >
                    <Plus className="w-3 h-3" />
                    <span>{isAdding ? t("Cancel", "إلغاء") : t("Add", "إضافة")}</span>
                </Button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-3 bg-surfaceMuted/50 rounded-xl border border-line space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                                {t("Type", "النوع")}
                            </label>
                            <select
                                value={resourceType}
                                onChange={(e) => setResourceType(e.target.value)}
                                className="w-full text-xs bg-canvas border border-line rounded-lg px-2 py-1.5 text-ink focus:outline-none focus:border-primary"
                            >
                                {resourceTypes.map(rType => (
                                    <option key={rType.value} value={rType.value}>{rType.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                                {t("Title", "عنوان الكتاب أو المصدر")}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t("Book or reference title", "اسم الكتاب أو المرجع")}
                                className="w-full text-xs bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                            {t("Author & Context", "المؤلف وسياق الذكر")}
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("Author name and relevance to the lecture...", "اسم المؤلف وعلاقته بموضوع المحاضرة...")}
                            className="w-full text-xs bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                            {t("URL (Optional)", "الرابط (اختياري)")}
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full text-xs bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs cursor-pointer">
                            {t("Cancel", "إلغاء")}
                        </Button>
                        <Button type="submit" size="sm" className="h-7 text-xs font-semibold cursor-pointer">
                            {t("Save", "حفظ")}
                        </Button>
                    </div>
                </form>
            )}

            {resources.length === 0 ? (
                <p className="text-[11.5px] text-inkMuted text-center py-3">
                    {t("No references added to this lesson yet.", "لا توجد مراجع مضافة للمحاضرة بعد.")}
                </p>
            ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                    {resources.map((res) => (
                        <div key={res.id} className="p-2.5 rounded-xl bg-surfaceMuted/40 border border-line text-xs space-y-1 hover:border-primary/30 transition" dir="auto">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 font-bold shrink-0 uppercase">
                                        {res.resource_type === 'book' ? t("Book", "كتاب") : (res.resource_type || t("Ref", "مرجع"))}
                                    </span>
                                    <span className="font-bold text-ink leading-snug">{res.title}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {res.url && res.url.trim().length > 0 && (
                                        <a
                                            href={res.url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="p-1 text-primary hover:bg-primary/10 rounded"
                                            title={t("Open Link", "فتح الرابط")}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(res.id)}
                                            className="p-1 text-inkMuted hover:text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer transition"
                                            title={t("Delete Resource", "حذف المرجع")}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {res.description && (
                                <p className="text-[11px] text-inkSecondary leading-relaxed pl-1 pr-1">
                                    {res.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LessonResources;
