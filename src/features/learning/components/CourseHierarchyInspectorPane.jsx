'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import {
    Folder,
    PlayCircle,
    Move,
    Edit3,
    Trash2,
    Plus,
    ExternalLink,
    ArrowUpRight,
    BookOpen
} from 'lucide-react';
import { sortHierarchyItems } from '@/features/learning/utils/hierarchy.logic.js';
import { SmartCommentBlock } from '@/components/ui/code-block';
export default function InspectorPane({ 
    item, 
    itemsMap, 
    t, 
    handleQuickUpdate, 
    handleDelete, 
    setMoveModalItem, 
    getYoutubeEmbed,
    onEdit
}) {
    const isCategory = item?.type?.toLowerCase() === 'category' || item?.resource_type?.toLowerCase() === 'category';
    const children = isCategory ? sortHierarchyItems(Object.values(itemsMap).filter(i => String(i.parent_id) === String(item.id))) : [];
    const parentCategory = item.parent_id ? itemsMap[item.parent_id] : null;
    const youtubeId = !isCategory ? getYoutubeEmbed(item.url) : null;
    const progress = Math.round(Number(item.progress_percentage) || 0);
    const lessonsCount = Number(item?.lessons_count ?? item?.actual_lessons_count ?? 0);
    const totalUnits = Number(item?.total_units || 0);
    const isComplete = totalUnits > 0 && lessonsCount >= totalUnits;
    const isPartial = lessonsCount > 0 && lessonsCount < totalUnits;
    const isEmpty = lessonsCount === 0;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCategory 
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                : 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29]'
                        }`}>
                            {isCategory ? t("Category Domain", "تصنيف رئيسي") : t("Course / Topic", "كورس تعليمي")}
                        </span>

                        {parentCategory && (
                            <span className="text-[10px] text-zinc-400 font-bold">
                                📁 {parentCategory.title}
                            </span>
                        )}
                    </div>

                    <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-tight break-words">
                        {item.title}
                    </h2>

                    {item.presenter_name && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] border border-[#BC5C29]/20 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                                <span>🎙️</span>
                                <span>{item.presenter_name}</span>
                            </span>
                        </div>
                    )}

                    {item.description && (
                        <div className="pt-1">
                            <SmartCommentBlock text={item.description} />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                        onClick={() => setMoveModalItem(item)}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                        <Move className="w-3.5 h-3.5 text-[#BC5C29]" />
                        <span>{t("Move", "نقل")}</span>
                    </button>

                    {onEdit ? (
                        <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-2 bg-zinc-100 hover:bg-[#BC5C29]/10 dark:bg-zinc-800 dark:hover:bg-[#BC5C29]/20 text-[#BC5C29] rounded-xl transition text-xs font-bold cursor-pointer"
                            title={t("Edit", "تعديل")}
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    ) : (
                        <Link 
                            href={`/courses/edit/${item.id}?returnTo=/courses/hierarchy`}
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition text-xs font-bold"
                            title={t("Edit", "تعديل")}
                        >
                            <Edit3 className="w-4 h-4" />
                        </Link>
                    )}

                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition text-xs font-bold cursor-pointer"
                        title={t("Delete", "حذف")}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isCategory ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                                {t("Sub-Items Count", "العناصر الفرعية")}
                            </span>
                            <span className="text-2xl font-black text-zinc-900 dark:text-white">
                                {children.length}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                                {t("Completed Courses", "الكورسات المنجزة")}
                            </span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {children.filter(c => c.progress_percentage >= 100 || c.status === 'completed').length} / {children.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link 
                            href={`/courses/add-category?parent_id=${item.id}`}
                            className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition text-center flex items-center justify-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t("+ Sub-Category", "+ تصنيف فرعي")}</span>
                        </Link>
                        <Link 
                            href={`/courses/add-course?parent_id=${item.id}`}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white font-bold text-xs transition text-center flex items-center justify-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t("+ Add Course", "+ إضافة كورس")}</span>
                        </Link>
                    </div>

                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            {t("Contents inside this category", "محتويات هذا التصنيف")} ({children.length})
                        </h4>

                        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                            {children.map(child => (
                                <div 
                                    key={child.id}
                                    className="p-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 transition flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        {(child.type?.toLowerCase() === 'category' || child.resource_type?.toLowerCase() === 'category') ? (
                                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                        ) : (
                                            <PlayCircle className="w-4 h-4 text-[#BC5C29] shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2 break-words leading-snug" title={child.title}>{child.title}</p>
                                            <p className="text-[10px] text-zinc-400">{(child.type?.toLowerCase() === 'category' || child.resource_type?.toLowerCase() === 'category') ? t("Category", "تصنيف") : `${child.completed_units || 0}/${child.total_units || 1} ${t("units", "وحدة")}`}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {child.type?.toLowerCase() !== 'category' && child.resource_type?.toLowerCase() !== 'category' && (
                                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                {child.progress_percentage || 0}%
                                            </span>
                                        )}
                                        <Link 
                                            href={`/courses/edit/${child.id}`}
                                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {children.length === 0 && (
                                <div className="p-6 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                    {t("Category is currently empty.", "التصنيف فارغ حالياً.")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <Link
                        href={`/courses/${item.id}`}
                        className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-[#BC5C29] to-[#E8734A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-card hover:opacity-95 transition"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>{t("Open Course Workspace & Lessons", "فتح مساحة عمل الكورس والمحاضرات")}</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    {youtubeId ? (
                        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-black aspect-video w-full">
                            <iframe 
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title={item.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    ) : item.url ? (
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center shrink-0">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                                <div className="truncate">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">{t("Course Resource Link", "رابط المادة التعليمية")}</span>
                                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">{item.url}</span>
                                </div>
                            </div>
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-[#BC5C29] hover:bg-[#BC5C29]/90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                            >
                                <span>{t("Open", "فتح")}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ) : null}

                    {/* Lecture Completeness Indicator Card */}
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isComplete
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                            : isPartial
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                    }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${
                                isComplete ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : isPartial ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_10px_#ef4444]'
                            }`} />
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                                    {t("Lectures Database Ingestion", "اكتمال المحاضرات في النظام")}
                                </span>
                                <span className="text-xs font-black">
                                    {isComplete
                                        ? t("🟢 All Lectures Ingested", "🟢 المحاضرات مكتملة في النظام")
                                        : isPartial
                                        ? t("🟡 Partial Lectures Ingested", "🟡 جزء من المحاضرات مضاف")
                                        : t("🔴 No Lectures Ingested", "🔴 لا توجد محاضرات مضافة")}
                                </span>
                            </div>
                        </div>
                        <div className="text-end shrink-0">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-current/20">
                                {lessonsCount} / {totalUnits} {t("lectures", "محاضرة")}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">{t("Status", "الحالة")}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white">
                                {item.status?.toLowerCase() === 'completed' || Number(item.progress_percentage) >= 100
                                    ? t("Completed", "مكتمل")
                                    : item.status?.toLowerCase() === 'overdue'
                                    ? t("Overdue", "متأخر")
                                    : t("In Progress", "قيد التقدم")}
                            </span>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">{t("Progress", "التقدم")}</span>
                            <span className="text-xs font-black text-emerald-500 font-mono">{progress}%</span>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">{t("Units", "الوحدات")}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white">{item.completed_units || 0} / {item.total_units || 1}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">{t("Target Date", "التاريخ")}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white">{item.expected_end_date ? String(item.expected_end_date).split('T')[0] : 'N/A'}</span>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-black text-zinc-900 dark:text-white">{t("Quick Units Progress Counter", "عداد إنجاز الوحدات المباشر")}</h3>
                                <p className="text-[10px] text-zinc-400">{t("Increment or decrement completed units", "تعديل الوحدات المنجزة بضغطة واحدة")}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        const newVal = Math.max(0, (item.completed_units || 0) - 1);
                                        handleQuickUpdate(item, newVal);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                                >
                                    -
                                </button>
                                <span className="text-base font-black w-10 text-center text-zinc-900 dark:text-white font-mono">
                                    {item.completed_units || 0}
                                </span>
                                <button 
                                    onClick={() => {
                                        const newVal = Math.min(item.total_units || 1, (item.completed_units || 0) + 1);
                                        handleQuickUpdate(item, newVal);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-[#BC5C29] text-white flex items-center justify-center font-black hover:bg-[#BC5C29]/90 transition cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    
                </div>
            )}
        </div>
    );
}
