'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/shared/context/AppContext.js';
import { Timeline } from '@/components/ui/timeline';
import { Plus, Search, Edit3, Trash2, Calendar, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from '@/shared/next-compat/link';
import { fetchFinanceMonths, saveFinanceMonth, deleteFinanceMonth } from '@/features/treasury/api/months.api.js';
import { filterAndSortMonths, formatTimelineItems } from '@/features/treasury/utils/months.logic.js';

export default function MonthlyBreakdownView() {
    const { t } = useApp();
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [newMonth, setNewMonth] = useState('January');
    const [newYear, setNewYear] = useState(new Date().getFullYear());
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const refreshMonths = () => {
        setLoading(true);
        fetchFinanceMonths()
            .then(data => {
                setMonths(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFinanceMonths()
            .then(data => {
                setMonths(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleOpenAdd = () => {
        setEditMode(false);
        setNewMonth('January');
        setNewYear(new Date().getFullYear());
        setIsFormOpen(true);
    };

    const handleOpenEdit = (m) => {
        setEditMode(true);
        setSelectedId(m.id);
        setNewMonth(m.month);
        setNewYear(m.year);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            month: newMonth,
            year: parseInt(newYear)
        };

        try {
            const data = await saveFinanceMonth(payload, editMode, selectedId);
            if (data?.success || data?.ok) {
                refreshMonths();
                setIsFormOpen(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const data = await deleteFinanceMonth(id);
            if (data?.success || data?.ok) {
                refreshMonths();
                setDeleteConfirmId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedMonths = useMemo(() => {
        return filterAndSortMonths(months, search, sortField, sortDirection);
    }, [months, search, sortField, sortDirection]);

    const timelineItems = useMemo(() => {
        return formatTimelineItems(sortedMonths, t, handleOpenEdit);
    }, [sortedMonths, t]);

    const renderSortHeader = (label, field, align = 'text-left') => {
        const isActive = sortField === field;
        return (
            <th
                onClick={() => handleSort(field)}
                className={`px-5 py-3.5 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition group ${align}`}
            >
                <div className={`inline-flex items-center gap-1.5 ${align === 'text-right' ? 'flex-row-reverse' : ''}`}>
                    <span>{label}</span>
                    <span className={`text-[10px] transition-colors ${isActive ? 'text-emerald-500 font-bold' : 'text-zinc-400 opacity-40 group-hover:opacity-85'}`}>
                        {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '▼'}
                    </span>
                </div>
            </th>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold tracking-tight text-zinc-950 dark:text-white">
                        {t("Timeline", "التسلسل الزمني (Timeline)")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Track timeline milestones, opening/closing balances, and net cash flow.", "متابعة أداء الشهور والسيولة النقدية وصافي التدفق المالي")}
                    </p>
                </div>
                <Button variant="default" size="default" onClick={handleOpenAdd} className="cursor-pointer shrink-0">
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("New Month", "إضافة شهر جديد")}</span>
                </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                                {t("Months Timeline", "التسلسل الزمني للشهور")}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {t("Chronological financial performance and net savings.", "عرض زمني للتدفقات النقدية وصافي التوفير")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full font-mono tabular-nums">
                            {sortedMonths.length} {t("Months", "شهور")}
                        </span>
                    </div>
                </div>

                <Timeline
                    items={timelineItems}
                    orientation="horizontal"
                    variant="spacious"
                    timestampPosition="top"
                />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                        {sortedMonths.length} {t("Records Found", "سجل")}
                    </span>
                    <div className="relative max-w-xs w-full">
                        <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t("Search months...", "بحث في الشهور...")}
                            className="w-full bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 ps-9 pe-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {sortedMonths.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                            {t("No months recorded yet", "لا توجد شهور مسجلة حالياً")}
                        </div>
                    ) : (
                        sortedMonths.map((m) => {
                            const netBal = Number(m.balance || 0);
                            const isPositive = netBal >= 0;
                            const revenue = Number(m.revenue || 0);
                            const netPct = revenue > 0
                                ? ((netBal / revenue) * 100).toFixed(1)
                                : (m.percentage !== undefined && m.percentage !== null ? Number(m.percentage).toFixed(1) : '0.0');

                            return (
                                <div key={m.id} className="p-4 space-y-3 bg-white dark:bg-zinc-900">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                                    {m.month} {m.year}
                                                </h4>
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                                                {t("Opening:", "رصيد الافتتاح:")} {Number(m.opening_balance || 0).toLocaleString()} EGP
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full text-xs tabular-nums ${isPositive
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                <span>{isPositive ? '+' : ''}{netBal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                <span className="opacity-70 text-[10px]">({netPct}%)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-[#BC5C29] block mt-0.5">
                                                {t("Closing:", "الختامي:")} {Number(m.closing_balance || 0).toLocaleString()} EGP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">{t("Revenues", "الإيرادات")}</span>
                                            <strong className="text-emerald-600 dark:text-emerald-400">+{revenue.toLocaleString()} EGP</strong>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">{t("Expenses", "المصروفات")}</span>
                                            <strong className="text-rose-600 dark:text-rose-400">-{Number(m.expenses || 0).toLocaleString()} EGP</strong>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                        <Link
                                            href={`/streams?month_id=${m.id}`}
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center gap-1"
                                        >
                                            <span>{t("View Log", "عرض السجل")}</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(m)}
                                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>{t("Edit", "تعديل")}</span>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(m.id)}
                                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>{t("Delete", "حذف")}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="hidden sm:block overflow-x-auto max-h-[640px]">
                    <table className="w-full min-w-[680px] text-left rtl:text-right border-collapse text-xs">
                        <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-xs">
                            <tr className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                {renderSortHeader(t("Month & Year", "الشهر والسنة"), "month_year", "text-left rtl:text-right")}
                                {renderSortHeader(t("Opening Bal (EGP)", "رصيد الافتتاح"), "opening_balance", "text-right")}
                                {renderSortHeader(t("Revenues (EGP)", "الإيرادات"), "revenue", "text-right")}
                                {renderSortHeader(t("Expenses (EGP)", "المصروفات"), "expenses", "text-right")}
                                {renderSortHeader(t("Net Flow (EGP / %)", "صافي التدفق"), "balance", "text-right")}
                                {renderSortHeader(t("Closing Bal (EGP)", "رصيد الإغلاق"), "closing_balance", "text-right")}
                                <th className="px-5 py-3.5 text-center">{t("Details", "التفاصيل")}</th>
                                <th className="px-5 py-3.5 text-center">{t("Actions", "الإجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                            {sortedMonths.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                                        {t("No months recorded yet", "لا توجد شهور مسجلة حالياً")}
                                    </td>
                                </tr>
                            ) : (
                                sortedMonths.map((m) => {
                                    const netBal = Number(m.balance || 0);
                                    const isPositive = netBal >= 0;
                                    const revenue = Number(m.revenue || 0);
                                    const netPct = revenue > 0
                                        ? ((netBal / revenue) * 100).toFixed(1)
                                        : (m.percentage !== undefined && m.percentage !== null ? Number(m.percentage).toFixed(1) : '0.0');

                                    return (
                                        <tr key={m.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                                            <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span>{m.month} {m.year}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                                                {Number(m.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                                                +{revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                                                -{Number(m.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full text-xs tabular-nums ${isPositive
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                    <span>{isPositive ? '+' : ''}{netBal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                    <span className="opacity-70 text-[10px]">({netPct}%)</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono tabular-nums font-extrabold text-[#BC5C29] dark:text-[#BC5C29]">
                                                {Number(m.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <Link
                                                    href={`/streams?month_id=${m.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition group"
                                                >
                                                    <span>{t("View Log", "عرض السجل")}</span>
                                                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(m)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                        title={t("Edit Month", "تعديل الشهر")}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(m.id)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition cursor-pointer"
                                                        title={t("Delete Month", "حذف الشهر")}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-up">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editMode ? t("Edit Month", "تعديل شهر مالي") : t("Add New Month", "إضافة شهر مالي جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Manage financial cycle periods for credits and debts.", "إدارة الفترات المالية للإيرادات والالتزامات.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Month Name", "اسم الشهر")}
                                </label>
                                <select
                                    value={newMonth}
                                    onChange={e => setNewMonth(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                >
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Year", "السنة")}
                                </label>
                                <input
                                    type="number"
                                    value={newYear}
                                    onChange={e => setNewYear(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? t("Saving...", "جاري الحفظ...") : (editMode ? t("Save Changes", "حفظ التعديلات") : t("Add Month", "تأكيد الإضافة"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmId && (() => {
                const deletingMonth = months.find(m => m.id === deleteConfirmId);
                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
                        onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
                    >
                        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-md w-full p-6 sm:p-7 shadow-2xl animate-scale-up space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            {t("Delete Month?", "هل تريد حذف هذا الشهر؟")}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {t("Irreversible action", "إجراء لا يمكن الرجوع فيه")}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                                >
                                    &times;
                                </button>
                            </div>
                            {deletingMonth && (
                                <div className="px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                                    {deletingMonth.month} {deletingMonth.year}
                                </div>
                            )}
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                                {t("Deleting this month will also cascade delete all associated credits and debts!", "تحذير: حذف هذا الشهر سيقوم بحذف جميع العمليات المالية والمستحقات والديون المرتبطة به بشكل كامل!")}
                            </p>
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{t("Confirm Delete", "تأكيد الحذف")}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
