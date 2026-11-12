'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/shared/context/AppContext.js';
import { Plus, Search, Edit3, Trash2, Calendar, Wallet, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubCommentsInput from '@/features/treasury/components/SubCommentsInput';
import SubCommentsList from '@/features/treasury/components/SubCommentsList';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { fetchCreditsList, fetchFinanceMonths, saveCredit, deleteCredit } from '@/features/treasury/api/credits.api.js';
import { getTypeLabel, getCreditColorClasses, sortCredits, calculateTotalCredits } from '@/features/treasury/utils/credits.logic.js';

export default function CreditsTrackerView() {
    const { t } = useApp();
    const [credits, setCredits] = useState([]);
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('1');
    const [note, setNote] = useState('');
    const [monthName, setMonthName] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
    const [year, setYear] = useState(() => String(new Date().getFullYear()));
    const [week, setWeek] = useState('1');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    const [sortField, setSortField] = useState('natural');
    const [sortDirection, setSortDirection] = useState('desc');

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const refreshCredits = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await fetchCreditsList();
            setCredits(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchCreditsList()
            .then(data => {
                setCredits(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        fetchFinanceMonths()
            .then(data => {
                setMonths(data || []);
            })
            .catch(err => console.error(err));
    }, []);

    const handleOpenAdd = () => {
        setEditMode(false);
        setName('');
        setAmount('');
        setType('1');
        setNote('');
        setMonthName(new Date().toLocaleString('en-US', { month: 'long' }));
        setYear(String(new Date().getFullYear()));
        setWeek('1');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (c) => {
        setEditMode(true);
        setSelectedId(c.id);
        setName(c.name);
        setAmount(c.amount);
        setType(String(c.type));
        setNote(c.note || '');
        setMonthName(c.month_name);
        setYear(String(c.month_year || c.year || new Date().getFullYear()));
        setWeek(String(c.week || 1));
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name,
            amount: parseFloat(amount),
            type: parseInt(type),
            note,
            monthName,
            year: parseInt(year),
            week: parseInt(week)
        };

        try {
            const currentScroll = window.scrollY;
            const data = await saveCredit(payload, editMode, selectedId);
            if (data?.success || data?.ok) {
                setIsFormOpen(false);
                await refreshCredits(true);
                window.scrollTo({ top: currentScroll, behavior: 'instant' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const currentScroll = window.scrollY;
            const data = await deleteCredit(id);
            if (data?.success || data?.ok) {
                await refreshCredits(true);
                setDeleteConfirmId(null);
                window.scrollTo({ top: currentScroll, behavior: 'instant' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const [hideZero, setHideZero] = useState(false);

    const filteredCredits = useMemo(() => {
        return credits.filter(c => {
            if (hideZero && parseFloat(c.amount || 0) === 0) return false;

            const matchesSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (c.note && c.note.toLowerCase().includes(search.toLowerCase())) ||
                (c.month_name && c.month_name.toLowerCase().includes(search.toLowerCase()));

            const matchesType = filterType === 'all' || String(c.type) === filterType;
            return matchesSearch && matchesType;
        });
    }, [credits, search, filterType, hideZero]);

    const sortedCredits = useMemo(() => {
        return sortCredits(filteredCredits, sortField, sortDirection);
    }, [filteredCredits, sortField, sortDirection]);

    const totalCreditsAmount = useMemo(() => {
        return calculateTotalCredits(filteredCredits);
    }, [filteredCredits]);

    const itemToDelete = useMemo(() => credits.find(c => c.id === deleteConfirmId), [credits, deleteConfirmId]);

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
                        {t("Streams Log", "سجل التدفقات والإيرادات (Streams)")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Manage all revenue streams, monthly salaries, and freelance incomes.", "متابعة وتدقيق الإيرادات والرواتب وعوائد العمل الحر")}
                    </p>
                </div>
                <Button variant="default" size="default" onClick={handleOpenAdd} className="cursor-pointer shrink-0">
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t("New Credit", "إضافة إيراد جديد")}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Total Revenues", "إجمالي الإيرادات")}
                        </span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {totalCreditsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-medium text-zinc-400">EGP</span>
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Total Entries", "عدد العمليات")}
                        </span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white mt-0.5 block">
                            {filteredCredits.length} <span className="text-xs font-normal text-zinc-400">{t("Entries", "بند")}</span>
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Active Filter", "التصنيف المختار")}
                        </span>
                        <span className="text-base font-bold text-zinc-700 dark:text-zinc-300 mt-0.5 block">
                            {filterType === 'all' ? t("All Categories", "كافة التصنيفات") : getTypeLabel(filterType, t)}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
                        >
                            <option value="all">{t("All Categories", "كل الأنواع")}</option>
                            <option value="1">{t("Salary", "راتب شهري")}</option>
                            <option value="2">{t("Freelance", "عمل حر")}</option>
                            <option value="3">{t("Fixed", "ثابت")}</option>
                            <option value="0">{t("Other", "أخرى")}</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setHideZero(prev => !prev)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 min-h-[38px] cursor-pointer ${hideZero
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-extrabold'
                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            title={t("Hide 0.00 items", "إخفاء البنود الصفرية")}
                        >
                            <span>{hideZero ? "✓ " + t("Non-zero only", "المبالغ الفعلية فقط") : t("Hide 0.00", "إخفاء الأصفار")}</span>
                        </button>

                        <select
                            value={sortField}
                            onChange={(e) => {
                                setSortField(e.target.value);
                                if (e.target.value === 'natural') setSortDirection('desc');
                            }}
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
                        >
                            <option value="natural">{t("Sort: Period (Newest)", "الترتيب: الفترة (الأحدث)")}</option>
                            <option value="name">{t("Sort: Name", "الترتيب: الاسم")}</option>
                            <option value="amount">{t("Sort: Amount", "الترتيب: المبلغ")}</option>
                        </select>

                        <button
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition min-h-[38px] flex items-center justify-center cursor-pointer"
                            title="Toggle Sort"
                        >
                            {sortDirection === 'asc' ? '↑ ASC' : '↓ DESC'}
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("Search by title, note, month...", "بحث بالعنوان، الملاحظة، الشهر...")}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[38px]"
                        />
                    </div>
                </div>

                <div className="hidden sm:block overflow-x-auto max-h-[640px]">
                    <table className="w-full min-w-[680px] text-left rtl:text-right border-collapse text-xs">
                        <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-xs">
                            <tr className="text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                {renderSortHeader(t("Item / Description", "البيان / البند"), "name", "text-left rtl:text-right")}
                                {renderSortHeader(t("Amount (EGP)", "المبلغ (ج.م)"), "amount", "text-right")}
                                <th className="px-5 py-3.5">{t("Category", "التصنيف")}</th>
                                <th className="px-5 py-3.5">{t("Received Period", "فترة الاستحقاق")}</th>
                                <th className="px-5 py-3.5">{t("Notes", "الملاحظات")}</th>
                                <th className="px-5 py-3.5 text-center">{t("Actions", "الإجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                            {sortedCredits.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                                        {t("No credits recorded matching your filter.", "لا توجد إيرادات مطابقة للشروط.")}
                                    </td>
                                </tr>
                            ) : (
                                sortedCredits.map((c, idx) => {
                                    const style = getCreditColorClasses(c.type);

                                    return (
                                        <tr key={c.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                                            <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
                                                {c.name}
                                            </td>

                                            <td className="px-5 py-4 text-right font-mono font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                +{parseFloat(c.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                    <span>{getTypeLabel(c.type, t)}</span>
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
                                                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                                    <span>{c.month_name} {c.month_year || c.year}</span>
                                                    <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">W{c.week || 1}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 max-w-xs">
                                                <SubCommentsList note={c.note} />
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(c)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                        title={t("Edit", "تعديل")}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(c.id)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                                                        title={t("Delete", "حذف")}
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

                <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 p-3 space-y-3">
                    {sortedCredits.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                            {t("No credits recorded matching your filter.", "لا توجد إيرادات مطابقة للشروط.")}
                        </div>
                    ) : (
                        sortedCredits.map((c, idx) => {
                            const style = getCreditColorClasses(c.type);
                            const amt = parseFloat(c.amount || 0);

                            return (
                                <div key={c.id || idx} className="bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl p-4 shadow-2xs space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white block" dir="auto">
                                                {c.name}
                                            </span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                    <span>{getTypeLabel(c.type, t)}</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                                    <Calendar className="w-3 h-3 text-zinc-400" />
                                                    {c.month_name} {c.month_year || c.year} (W{c.week || 1})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-base font-extrabold font-mono tabular-nums block ${amt === 0 ? 'text-zinc-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {amt === 0 ? '+0.00' : `+${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                            <span className="text-[10px] font-semibold text-zinc-400">EGP</span>
                                        </div>
                                    </div>

                                    {c.note && (
                                        <div className="bg-white/70 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                                            <SubCommentsList note={c.note} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                                        <button
                                            onClick={() => handleOpenEdit(c)}
                                            className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            <span>{t("Edit", "تعديل")}</span>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(c.id)}
                                            className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>{t("Delete", "حذف")}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-md w-full p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-up text-zinc-900 dark:text-white">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editMode ? t("Edit Revenue / Credit", "تعديل إيراد / مستحقة") : t("Add New Revenue / Credit", "إضافة إيراد / مستحقة جديدة")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Record income, freelance payments, or recurring credits.", "تسجيل الدخل، مستحقات العمل الحر، أو الإيرادات الدورية.")}
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
                        <form onSubmit={handleFormSubmit} className="space-y-4 font-sans">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Name / Description", "الاسم / البيان")} <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required value={name} onChange={e => setName(e.target.value)}
                                    placeholder={t("e.g. Monthly Salary", "مثال: راتب شهري")}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Amount (EGP)", "القيمة (ج.م)")} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Category", "النوع")}</label>
                                    <select
                                        value={type} onChange={e => setType(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        <option value="1">{t("Salary", "راتب شهري")}</option>
                                        <option value="2">{t("Freelance", "عمل حر")}</option>
                                        <option value="3">{t("Fixed", "ثابت")}</option>
                                        <option value="0">{t("Other", "أخرى")}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Month", "الشهر")}</label>
                                    <select
                                        value={monthName} onChange={e => setMonthName(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Year", "السنة")}</label>
                                    <select
                                        value={year} onChange={e => setYear(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Week", "الأسبوع")}</label>
                                    <select
                                        value={week} onChange={e => setWeek(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                    >
                                        {["1", "2", "3", "4", "5"].map(w => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <SubCommentsInput
                                value={note}
                                onChange={setNote}
                                label={t("Notes / Sub-Comments", "الملاحظات / البنود الفرعية")}
                                placeholder={t("e.g. Salary bonus or any note...", "مثال: بونص أو أي ملاحظة...")}
                            />
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-5 flex items-center justify-end gap-2.5">
                                <button
                                    type="button" onClick={() => setIsFormOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit" disabled={submitting}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? t("Saving...", "جاري الحفظ...") : (editMode ? t("Save Changes", "حفظ التعديلات") : t("Add Credit", "تأكيد الإضافة"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => handleDelete(deleteConfirmId)}
                title={t("Delete Credit Entry?", "حذف بند الإيداع")}
                description={t("This action is permanent and cannot be undone.", "هذا الإجراء سيقوم بحذف البند بشكل نهائي من قاعدة البيانات ولا يمكن استرجاعه.")}
                confirmText={t("Delete Permanently", "تأكيد الحذف")}
                cancelText={t("Cancel", "إلغاء")}
            />
        </div>
    );
}
