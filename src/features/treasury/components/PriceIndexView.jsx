'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { Plus, Search, Edit3, Trash2, RefreshCw, Coins, Clock, DollarSign, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchFinancePrices, saveFinancePrice, deleteFinancePrice, syncGoldServicePrice } from '@/features/treasury/api/prices.api.js';
import { calculateMarketRates, filterAndSortPrices } from '@/features/treasury/utils/prices.logic.js';

export default function PriceIndexView() {
    const { t } = useApp();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [dollar, setDollar] = useState('');
    const [riyal, setRiyal] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');

    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const refreshPrices = () => {
        setLoading(true);
        fetchFinancePrices()
            .then(data => {
                setPrices(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFinancePrices()
            .then(data => {
                setPrices(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleOpenAdd = () => {
        setEditMode(false);
        setName('');
        setPrice('');
        setDollar('');
        setRiyal('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (p) => {
        setEditMode(true);
        setSelectedId(p.id);
        setName(p.name || '');
        setPrice(p.price || '');
        setDollar(p.dollar || '');
        setRiyal(p.riyal || '');
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name,
            price: parseFloat(price),
            dollar: dollar ? parseFloat(dollar) : null,
            riyal: riyal ? parseFloat(riyal) : null
        };

        try {
            const data = await saveFinancePrice(payload, editMode, selectedId);
            if (data?.success || data?.ok) {
                refreshPrices();
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
            const data = await deleteFinancePrice(id);
            if (data?.success || data?.ok) {
                refreshPrices();
                setDeleteConfirmId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSyncMarketRates = async () => {
        setSyncing(true);
        try {
            const data = await syncGoldServicePrice();
            if (data.status === 'success') {
                refreshPrices();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSyncing(false);
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

    const marketRates = useMemo(() => {
        return calculateMarketRates(prices);
    }, [prices]);

    const sortedPrices = useMemo(() => {
        return filterAndSortPrices(prices, search, sortField, sortDirection);
    }, [prices, search, sortField, sortDirection]);

    const renderSortHeader = (label, field, align = 'text-left') => {
        const isActive = sortField === field;
        return (
            <th
                onClick={() => handleSort(field)}
                className={`px-5 py-3.5 cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition group ${align}`}
            >
                <div className={`inline-flex items-center gap-1.5 ${align === 'text-right' ? 'flex-row-reverse' : ''}`}>
                    <span>{label}</span>
                    <span className={`text-[10px] transition-colors ${isActive ? 'text-amber-500 font-bold' : 'text-zinc-400 opacity-40 group-hover:opacity-85'}`}>
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
                        {t("Live Market Rates & Price Tracking", "أسعار السوق ومؤشرات التسعير")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Real-time benchmark gold prices, market rates, and currency tracking (USD & SAR).", "متابعة وتحديث أسعار الذهب اللحظية ومؤشرات العملات (الدولار والريال)")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={handleSyncMarketRates}
                        disabled={syncing}
                        title={t("Sync live benchmark rates for gold, US Dollar, and Saudi Riyal", "تحديث أسعار الذهب والدولار والريال فورياً")}
                        className="cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? 'animate-spin text-amber-500' : ''}`} />
                        <span>{syncing ? t("Syncing...", "جاري المزامنة...") : t("Sync Market Rates", "تحديث الأسعار")}</span>
                    </Button>
                    <Button
                        variant="default"
                        size="default"
                        onClick={handleOpenAdd}
                        className="cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("New Rate", "إضافة سعر جديد")}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Gold 24K", "عيار 24 (نقي)")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white mt-1 block">
                            {marketRates.rate24.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs">
                        24K
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Gold 21K", "عيار 21 (المحلي)")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-amber-500 mt-1 block">
                            {marketRates.rate21.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs">
                        21K
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Gold 18K", "عيار 18")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white mt-1 block">
                            {marketRates.rate18.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono font-bold text-xs">
                        18K
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#BC5C29]" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Gold Pound", "الجنيه الذهب")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-[#BC5C29] mt-1 block">
                            {marketRates.poundRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#BC5C29]/10 text-[#BC5C29] flex items-center justify-center">
                        <Coins className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("US Dollar (USD)", "الدولار الأمريكي")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
                            {parseFloat(marketRates.usdRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Saudi Riyal (SAR)", "الريال السعودي")}
                            </span>
                        </div>
                        <span className="text-lg font-extrabold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1 block">
                            {parseFloat(marketRates.sarRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                        </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <CircleDollarSign className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                        {sortedPrices.length} {t("Rates Listed", "سعر مسجل")}
                    </span>
                    <div className="relative max-w-xs w-full">
                        <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t("Search price rates...", "بحث في قوائم الأسعار...")}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ps-9 pe-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                </div>

                <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {sortedPrices.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                            {t("No price rates listed.", "لا توجد أسعار مسجلة.")}
                        </div>
                    ) : (
                        sortedPrices.map((p, idx) => (
                            <div key={p.id || idx} className="p-4 space-y-3 bg-white dark:bg-zinc-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white" dir="auto">
                                                {p.name}
                                            </h4>
                                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                                                {p.updated_at ? new Date(p.updated_at).toLocaleString() : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-extrabold font-mono text-base text-emerald-600 dark:text-emerald-400">
                                            {parseFloat(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <span className="text-[10px] text-zinc-400 font-sans">EGP</span>
                                    </div>
                                </div>

                                {(p.dollar || p.riyal) && (
                                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                                        {p.dollar && (
                                            <span>USD: <strong className="text-emerald-600 dark:text-emerald-400">{parseFloat(p.dollar).toFixed(2)}</strong> EGP</span>
                                        )}
                                        {p.riyal && (
                                            <span>SAR: <strong className="text-teal-600 dark:text-teal-400">{parseFloat(p.riyal).toFixed(2)}</strong> EGP</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                    <button
                                        onClick={() => handleOpenEdit(p)}
                                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>{t("Edit", "تعديل")}</span>
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(p.id)}
                                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>{t("Delete", "حذف")}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left rtl:text-right border-collapse text-xs">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                {renderSortHeader(t("Asset / Currency Item", "البند / الأصل"), "name", "text-left rtl:text-right")}
                                {renderSortHeader(t("Current Rate (EGP)", "السعر الحالي (ج.م)"), "price", "text-right")}
                                {renderSortHeader(t("Dollar / USD (EGP)", "الدولار (ج.م)"), "dollar", "text-right")}
                                {renderSortHeader(t("Riyal / SAR (EGP)", "الريال (ج.م)"), "riyal", "text-right")}
                                {renderSortHeader(t("Last Updated", "آخر تحديث"), "updated_at", "text-left")}
                                <th className="px-5 py-3.5 text-center">{t("Actions", "الإجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                            {sortedPrices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                                        {t("No price rates listed.", "لا توجد أسعار مسجلة.")}
                                    </td>
                                </tr>
                            ) : (
                                sortedPrices.map((p, idx) => (
                                    <tr key={p.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                                        <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                <span>{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                            {parseFloat(p.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                            {p.dollar ? parseFloat(p.dollar).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                            {p.riyal ? parseFloat(p.riyal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                <span>{p.updated_at ? new Date(p.updated_at).toLocaleString() : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(p)}
                                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                    title={t("Edit", "تعديل")}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(p.id)}
                                                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition cursor-pointer"
                                                    title={t("Delete", "حذف")}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editMode ? t("Edit Price Rate", "تعديل السعر") : t("Add New Price Rate", "إضافة مؤشر سعر جديد")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Update reference exchange and gold rates.", "تحديث مؤشرات الأسعار والعملات والعيارات المرجعية.")}
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
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Item Name", "اسم البند / العيار")} <span className="text-red-500">*</span></label>
                                <input
                                    type="text" required value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Gold 24K / US Dollar (USD)"
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Price Rate (EGP)", "السعر بالجنيه المصري")} <span className="text-red-500">*</span></label>
                                <input
                                    type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Dollar / USD (EGP)", "سعر الدولار")}</label>
                                    <input
                                        type="number" step="0.01" value={dollar} onChange={e => setDollar(e.target.value)}
                                        placeholder="50.45"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Riyal / SAR (EGP)", "سعر الريال")}</label>
                                    <input
                                        type="number" step="0.01" value={riyal} onChange={e => setRiyal(e.target.value)}
                                        placeholder="13.45"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                            </div>
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
                                    {submitting ? t("Saving...", "جاري الحفظ...") : (editMode ? t("Save Changes", "حفظ التعديلات") : t("Add Price Rate", "تأكيد الإضافة"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmId && (() => {
                const deletingPrice = prices.find(p => p.id === deleteConfirmId);
                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                        onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
                    >
                        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-md w-full p-6 sm:p-7 shadow-2xl animate-scale-up space-y-4 text-zinc-900 dark:text-white">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            {t("Delete Price Rate?", "هل تريد حذف هذا السعر؟")}
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
                            {deletingPrice && (
                                <div className="px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs flex justify-between items-center">
                                    <span className="font-bold text-zinc-900 dark:text-white">{deletingPrice.name}</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {parseFloat(deletingPrice.price || 0).toLocaleString()} EGP
                                    </span>
                                </div>
                            )}
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {t("This action is permanent and cannot be undone.", "هذا الإجراء سيقوم بحذف البند بشكل نهائي من قاعدة البيانات ولا يمكن استرجاعه.")}
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
