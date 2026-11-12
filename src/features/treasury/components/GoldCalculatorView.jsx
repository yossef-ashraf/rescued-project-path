'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/shared/context/AppContext.js';
import { Plus, Search, Edit3, Trash2, Coins, TrendingUp, TrendingDown, Eye, X, Image as ImageIcon, Scale, Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubCommentsInput from '@/features/treasury/components/SubCommentsInput';
import SubCommentsList from '@/features/treasury/components/SubCommentsList';
import { fetchGoldAssets, fetchFinanceMonths, uploadImageFile, submitGoldAsset, deleteGoldAsset } from '@/features/treasury/api/gold.api.js';
import { fetchFinancePrices, syncGoldServicePrice } from '@/features/treasury/api/prices.api.js';
import { getMediaSrc, calculateGoldMetrics, filterAndSortGold, getAssetTypeInfo } from '@/features/treasury/utils/gold.logic.js';

export default function GoldCalculatorView() {
    const { t } = useApp();
    const [goldAssets, setGoldAssets] = useState([]);
    const [months, setMonths] = useState([]);
    const [marketPrices, setMarketPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('EGP');
    const [val, setVal] = useState('');
    const [price, setPrice] = useState('');
    const [rate, setRate] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [monthId, setMonthId] = useState('');
    const [monthName, setMonthName] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));
    const [year, setYear] = useState(() => String(new Date().getFullYear()));
    const [week, setWeek] = useState('1');
    const [gregorianDate, setGregorianDate] = useState(new Date().toISOString().slice(0, 10));
    const [hijriDate, setHijriDate] = useState('');
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');

    const [previewImage, setPreviewImage] = useState(null);

    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');
    const [nonZeroOnly, setNonZeroOnly] = useState(false);

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const refreshGoldData = () => {
        setLoading(true);
        fetchGoldAssets()
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
                setGoldAssets(list);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setGoldAssets([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchGoldAssets()
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
                setGoldAssets(list);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setGoldAssets([]);
                setLoading(false);
            });

        fetchFinanceMonths()
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
                setMonths(list);
                if (list.length > 0) setMonthId(list[0].id);
            })
            .catch(err => console.error(err));

        fetchFinancePrices()
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setMarketPrices(list);
            })
            .catch(err => console.error(err));
    }, []);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadImageFile(file);
            if (data && data.success) {
                setImage(data.filePath);
            }
        } catch (err) {
            console.error("Image upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditMode(false);
        setName('');
        setCurrency('EGP');
        setVal('');
        setPrice('');
        setRate('1');
        setAmount('');
        setNote('');
        if (months.length > 0) setMonthId(months[0].id);
        setMonthName(new Date().toLocaleString('en-US', { month: 'long' }));
        setYear(String(new Date().getFullYear()));
        setWeek('1');
        setGregorianDate(new Date().toISOString().slice(0, 10));
        setHijriDate('');
        setImage('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (g) => {
        const defaultMonth = new Date().toLocaleString('en-US', { month: 'long' });
        setEditMode(true);
        setSelectedId(g.id);
        setName(g.name || '');
        setCurrency(g.currency || (getAssetTypeInfo(g.name, g.note).type || 'EGP'));
        setVal(g.val !== undefined && g.val !== null ? String(g.val) : '');
        setPrice(g.price !== undefined && g.price !== null ? String(g.price) : '');
        setRate(g.rate !== undefined && g.rate !== null ? String(g.rate) : '');
        setAmount(g.amount !== undefined && g.amount !== null ? String(g.amount) : '');
        setNote(g.note || '');
        setMonthId(g.month_id || '');
        setMonthName(g.month ? ({
            1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
            7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December'
        })[g.month] || defaultMonth : defaultMonth);
        setYear(g.year ? String(g.year) : String(new Date().getFullYear()));
        setWeek(g.week ? String(g.week) : '1');
        setGregorianDate(g.gregorian_date ? new Date(g.gregorian_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        setHijriDate(g.hijri_date || '');
        setImage(g.image || '');
        setIsFormOpen(true);
    };

    const handleCurrencyChange = (newCurr) => {
        setCurrency(newCurr);
        if (newCurr === 'EGP') {
            handleRateChange('1');
        } else if (newCurr === 'USD') {
            const p = marketPrices.find(mp => (mp.name || '').toLowerCase().includes('dollar') || (mp.name || '').toLowerCase().includes('usd'));
            if (p) handleRateChange(String(p.price));
        } else if (newCurr === 'SAR') {
            const p = marketPrices.find(mp => (mp.name || '').toLowerCase().includes('riyal') || (mp.name || '').toLowerCase().includes('sar'));
            if (p) handleRateChange(String(p.price));
        } else if (newCurr === 'GOLD_24') {
            const p = marketPrices.find(mp => (mp.name || '').toLowerCase().includes('24'));
            if (p) handleRateChange(String(p.price));
        } else if (newCurr === 'GOLD_21') {
            const p = marketPrices.find(mp => (mp.name || '').toLowerCase().includes('21'));
            if (p) handleRateChange(String(p.price));
        } else if (newCurr === 'GOLD_18') {
            const p = marketPrices.find(mp => (mp.name || '').toLowerCase().includes('18'));
            if (p) handleRateChange(String(p.price));
        }
    };

    const handleValChange = (newVal) => {
        setVal(newVal);
        const parsedVal = parseFloat(newVal);
        const parsedRate = parseFloat(rate);
        if (!isNaN(parsedVal) && parsedVal > 0 && !isNaN(parsedRate) && parsedRate > 0) {
            const calculatedAmount = Math.round(parsedVal * parsedRate * 100) / 100;
            setAmount(String(calculatedAmount));
            if (!price || parseFloat(price) === 0) {
                setPrice(String(calculatedAmount));
            }
        }
    };

    const handleRateChange = (newRate) => {
        setRate(newRate);
        const parsedRate = parseFloat(newRate);
        const parsedVal = parseFloat(val);
        if (!isNaN(parsedVal) && parsedVal > 0 && !isNaN(parsedRate) && parsedRate > 0) {
            const calculatedAmount = Math.round(parsedVal * parsedRate * 100) / 100;
            setAmount(String(calculatedAmount));
            if (!price || parseFloat(price) === 0) {
                setPrice(String(calculatedAmount));
            }
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            name,
            currency: currency || 'EGP',
            val: val ? parseFloat(val) : 0,
            price: price ? parseFloat(price) : 0,
            rate: rate ? parseFloat(rate) : null,
            amount: amount ? parseFloat(amount) : 0,
            note,
            monthName,
            year: parseInt(year),
            week: parseInt(week),
            gregorian_date: gregorianDate || null,
            hijri_date: hijriDate || null,
            image: image || null
        };

        if (editMode) {
            payload.id = selectedId;
        }

        try {
            const data = await submitGoldAsset(payload, editMode);
            if (data?.success || data?.ok) {
                refreshGoldData();
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
            const data = await deleteGoldAsset(id);
            if (data?.success || data?.ok) {
                refreshGoldData();
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
                refreshGoldData();
                fetchFinancePrices().then(d => setMarketPrices(Array.isArray(d) ? d : []));
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

    const metrics = useMemo(() => {
        return calculateGoldMetrics(goldAssets);
    }, [goldAssets]);

    const sortedGold = useMemo(() => {
        let list = filterAndSortGold(goldAssets, search, sortField, sortDirection);
        if (nonZeroOnly) {
            list = list.filter(g => (parseFloat(g.val || 0) > 0 || parseFloat(g.amount || 0) > 0 || parseFloat(g.price || 0) > 0));
        }
        return list;
    }, [goldAssets, search, sortField, sortDirection, nonZeroOnly]);

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

    const formAssetInfo = useMemo(() => {
        return getAssetTypeInfo(name, note, currency);
    }, [name, note, currency]);

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold tracking-tight text-zinc-950 dark:text-white">
                        {t("Investments & Savings Portfolio", "محفظة الاستثمارات والمدخرات")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Track gold, currencies, unit rates, purchase costs, and valuations in EGP.", "متابعة أصول الذهب والعملات (الدولار والريال)، وسعر الصرف، وتكلفة الشراء والقيمة بالجنيه المصري")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={handleSyncMarketRates}
                        disabled={syncing}
                        title={t("Sync live market rates (Gold, Dollar, Riyal)", "تحديث أسعار الذهب والدولار والريال فورياً")}
                        className="cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${syncing ? 'animate-spin text-amber-500' : ''}`} />
                        <span>{syncing ? t("Syncing...", "جاري المزامنة...") : t("Sync Market Rates", "تحديث الأسعار")}</span>
                    </Button>
                    <Button
                        variant="default"
                        size="default"
                        onClick={handleOpenAdd}
                        className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-black"
                    >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("New Asset / Gold", "إضافة أصل / ذهب")}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Gold Valuation", "قيمة الذهب الحالية")}
                        </span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-amber-500 mt-0.5 block">
                            {metrics.totalGoldValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                            {t("Pure gold assets value", "تقييم أصول الذهب فقط")}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Coins className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("21K Standard Weight", "وزن الذهب (معادل عيار 21)")}
                            </span>
                        </div>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white mt-0.5 block">
                            {metrics.equivalent21kWeight.toFixed(2)} <span className="text-xs text-zinc-400 font-sans">g (21K)</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block mt-0.5" title="الوزن الخام لجميع السبائك قبل التحويل القياسي">
                            {t("Raw weight:", "الوزن الفعلي:")} <strong className="text-amber-600 dark:text-amber-400 font-mono">{metrics.rawWeight.toFixed(2)} g</strong>
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Scale className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Unrealized P&L", "الأرباح غير المحققة")}
                        </span>
                        <span className={`text-xl font-extrabold font-mono tabular-nums mt-0.5 block ${metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {metrics.totalProfit >= 0 ? '+' : ''}{metrics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-xs font-sans">({metrics.profitPercentage.toFixed(1)}%)</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                            {t("Market gain over cost", "فارق السوق عن تكلفة الشراء")}
                        </span>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${metrics.totalProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {metrics.totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {t("Total Cost Basis", "إجمالي تكلفة الشراء")}
                        </span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-white mt-0.5 block">
                            {metrics.totalPortfolioCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                            {t("Gold + Currencies cost", "تكلفة الذهب والعملات الفعلية")}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-[#BC5C29] uppercase tracking-wider block">
                            {t("Total Portfolio Value", "إجمالي المحفظة الشاملة")}
                        </span>
                        <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            {metrics.totalCurrentValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                            {t("Gold:", "ذهب:")} {Math.round(metrics.totalGoldValuation).toLocaleString()} + {t("Cash/FX:", "عملات وكاش:")} {Math.round(metrics.liquidCash).toLocaleString()}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                            {sortedGold.length} {t("Assets Registered", "أصل مسجل")}
                        </span>
                        <button
                            type="button"
                            onClick={() => setNonZeroOnly(!nonZeroOnly)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shrink-0 ${nonZeroOnly
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                                }`}
                        >
                            <span>{nonZeroOnly ? '✓' : '○'}</span>
                            <span>{t("Non-zero only", "القيم النشطة فقط")}</span>
                        </button>
                    </div>

                    <div className="relative max-w-xs w-full">
                        <Search className="w-4 h-4 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t("Search assets, karats, currencies...", "بحث في الأصول والسبائك والعملات...")}
                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ps-9 pe-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                </div>

                <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {sortedGold.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                            {t("No gold or asset records found.", "لا توجد أصول ذهبية أو نقدية مسجلة.")}
                        </div>
                    ) : (
                        sortedGold.map((g, idx) => {
                            const profit = parseFloat(g.amount || 0) - parseFloat(g.price || 0);
                            const profitPct = parseFloat(g.price || 0) > 0 ? ((profit / parseFloat(g.price)) * 100).toFixed(1) : '0.0';
                            const isProfit = profit >= 0;
                            const mediaUrl = getMediaSrc(g.image);
                            const info = getAssetTypeInfo(g.name, g.note, g.currency);
                            const quantity = parseFloat(g.val || 0);
                            const unitRate = parseFloat(g.rate || 0);

                            return (
                                <div key={g.id || idx} className="p-4 space-y-3 bg-white dark:bg-zinc-900">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {mediaUrl ? (
                                                <button
                                                    onClick={() => setPreviewImage({ url: mediaUrl, title: g.name })}
                                                    className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0"
                                                >
                                                    <img src={mediaUrl} alt={g.name} className="w-full h-full object-cover" />
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-950 shrink-0">
                                                    <ImageIcon className="w-5 h-5 opacity-40" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white" dir="auto">
                                                    {g.name}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${info.badgeClass}`}>
                                                        {info.badgeLabel}
                                                    </span>
                                                    {quantity > 0 && (
                                                        <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                            {quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {info.unitLabel}
                                                        </span>
                                                    )}
                                                    {unitRate > 0 && (
                                                        <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                                            @ {unitRate.toLocaleString()} EGP
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-zinc-400 font-mono">
                                                        {g.gregorian_date ? new Date(g.gregorian_date).toLocaleDateString('en-GB') : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="font-extrabold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                                {parseFloat(g.amount || 0).toLocaleString()} <span className="text-[10px] font-sans font-normal text-zinc-400">EGP</span>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full text-[10px] mt-1 tabular-nums ${isProfit
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {isProfit ? '+' : ''}{Math.round(profit).toLocaleString()} ({profitPct}%)
                                            </span>
                                        </div>
                                    </div>

                                    {g.note && (
                                        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl text-xs text-zinc-600 dark:text-zinc-300">
                                            <SubCommentsList note={g.note} />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                                        <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                                            <span>{t("Buy Price:", "سعر الشراء:")} </span>
                                            <strong className="font-mono text-zinc-800 dark:text-zinc-200">{parseFloat(g.price || 0).toLocaleString()} EGP</strong>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(g)}
                                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>{t("Edit", "تعديل")}</span>
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(g.id)}
                                                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
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

                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left rtl:text-right border-collapse text-xs">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                <th className="px-5 py-3.5 text-center">{t("Receipt / Asset", "المستند")}</th>
                                {renderSortHeader(t("Asset Description", "البيان / الأصل"), "name", "text-left rtl:text-right")}
                                {renderSortHeader(t("Weight / Qty", "الوزن / الكمية"), "val", "text-right")}
                                {renderSortHeader(t("Unit Rate (Rate)", "سعر الوحدة (Rate)"), "rate", "text-right")}
                                {renderSortHeader(t("Buy Cost (EGP)", "سعر الشراء"), "price", "text-right")}
                                {renderSortHeader(t("Current Value (EGP)", "القيمة الحالية بالمصري"), "amount", "text-right")}
                                {renderSortHeader(t("Unrealized P&L", "الأرباح والفرق"), "profit", "text-right")}
                                {renderSortHeader(t("Date", "تاريخ الشراء"), "gregorian_date", "text-left")}
                                <th className="px-5 py-3.5 text-center">{t("Actions", "الإجراءات")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                            {sortedGold.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500">
                                        {t("No gold or asset records found.", "لا توجد أصول ذهبية أو نقدية مسجلة.")}
                                    </td>
                                </tr>
                            ) : (
                                sortedGold.map((g, idx) => {
                                    const profit = parseFloat(g.amount || 0) - parseFloat(g.price || 0);
                                    const profitPct = parseFloat(g.price || 0) > 0 ? ((profit / parseFloat(g.price)) * 100).toFixed(1) : '0.0';
                                    const isProfit = profit >= 0;
                                    const mediaUrl = getMediaSrc(g.image);
                                    const info = getAssetTypeInfo(g.name, g.note, g.currency);
                                    const quantity = parseFloat(g.val || 0);
                                    const unitRate = parseFloat(g.rate || 0);

                                    return (
                                        <tr key={g.id || idx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                                            <td className="px-5 py-4 text-center">
                                                {mediaUrl ? (
                                                    <button
                                                        onClick={() => setPreviewImage({ url: mediaUrl, title: g.name })}
                                                        className="relative group w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 inline-block cursor-pointer shadow-2xs"
                                                    >
                                                        <img src={mediaUrl} alt={g.name} referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                            <Eye className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-950 mx-auto">
                                                        <ImageIcon className="w-4 h-4 opacity-40" />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 font-bold text-zinc-900 dark:text-white" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${info.isGold ? 'bg-amber-400' : (info.type === 'SAR' ? 'bg-teal-400' : (info.type === 'USD' ? 'bg-emerald-400' : 'bg-blue-400'))}`} />
                                                    <span>{g.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${info.badgeClass}`}>
                                                        {info.badgeLabel}
                                                    </span>
                                                </div>
                                                {g.note && (
                                                    <div className="mt-1">
                                                        <SubCommentsList note={g.note} />
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                {quantity > 0 ? (
                                                    <span>
                                                        {quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}{' '}
                                                        <span className="text-[10px] font-sans font-normal text-zinc-400">{info.unitLabel}</span>
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            <td className="px-5 py-4 text-right font-mono font-bold tabular-nums text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                                {unitRate > 0 ? (
                                                    <span>
                                                        {unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                        <span className="text-[10px] font-sans font-normal text-zinc-400">EGP</span>
                                                    </span>
                                                ) : '-'}
                                            </td>

                                            <td className="px-5 py-4 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                                {parseFloat(g.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                <span className="text-[10px] font-sans font-normal text-zinc-400">EGP</span>
                                            </td>

                                            <td className="px-5 py-4 text-right font-mono font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                {parseFloat(g.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                                <span className="text-[10px] font-sans font-bold text-zinc-400">EGP</span>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full text-xs tabular-nums ${isProfit
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                    <span>{isProfit ? '+' : ''}{Math.round(profit).toLocaleString()}</span>
                                                    <span className="opacity-70 text-[10px]">({profitPct}%)</span>
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 font-mono whitespace-nowrap">
                                                <div className="font-bold text-zinc-800 dark:text-zinc-200">
                                                    {g.gregorian_date ? new Date(g.gregorian_date).toLocaleDateString('en-GB') : '-'}
                                                </div>
                                                {g.hijri_date && (
                                                    <div className="text-[11px] text-amber-600/90 dark:text-amber-400/90 font-sans mt-0.5">
                                                        {g.hijri_date}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(g)}
                                                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                        title={t("Edit", "تعديل")}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(g.id)}
                                                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition cursor-pointer"
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
            </div>

            {previewImage && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={previewImage.url}
                            alt={previewImage.title}
                            className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20"
                        />
                        <span className="text-white text-sm font-bold mt-3 bg-black/60 px-4 py-1.5 rounded-full border border-white/10">
                            {previewImage.title}
                        </span>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-hidden animate-scale-up text-zinc-900 dark:text-white my-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {editMode ? t("Edit Investment Asset", "تعديل أصل استثماري") : t("Add New Investment Asset / Saving", "إضافة أصل / مدخرات جديدة")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Record quantity, unit rate, cost, and valuation.", "تسجيل الكمية وسعر الصرف/الوحدة والقيمة الإجمالية بالمصري.")}
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
                            {/* Preset Shortcuts */}
                            <div className="space-y-1.5 pb-1 border-b border-zinc-100 dark:border-zinc-800/60">
                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">{t("Quick Presets:", "اختيار فئة سريعة:")}</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: 'عيار 24 (24K)', name: 'Gold 24', currency: 'GOLD_24', search: '24' },
                                        { label: 'عيار 21 (21K)', name: 'Gold 21', currency: 'GOLD_21', search: '21' },
                                        { label: 'عيار 18 (18K)', name: 'Gold 18', currency: 'GOLD_18', search: '18' },
                                        { label: 'ريال سعودي (SAR)', name: 'Cash SAR', currency: 'SAR', search: 'riyal' },
                                        { label: 'دولار أمريكي (USD)', name: 'Cash USD', currency: 'USD', search: 'dollar' },
                                        { label: 'كاش مصري (EGP)', name: 'Cash EGP', currency: 'EGP', rate: 1 }
                                    ].map((cat, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                if (!name || name.startsWith('Gold') || name.startsWith('Cash') || name.startsWith('Cach')) {
                                                    setName(cat.name);
                                                }
                                                if (cat.currency) {
                                                    setCurrency(cat.currency);
                                                }
                                                let targetRate = cat.rate || null;
                                                if (!targetRate && cat.search) {
                                                    const matched = marketPrices.find(p => (p.name || '').toLowerCase().includes(cat.search));
                                                    if (matched) targetRate = parseFloat(matched.price);
                                                }
                                                if (targetRate) {
                                                    handleRateChange(String(targetRate));
                                                }
                                            }}
                                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/60 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition cursor-pointer"
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Asset Description", "الاسم / الوصف")} <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Cash EGP / سبائك عيار 24 / Cash SAR"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Currency / Classification", "نوع العملة / تصنيف الأصل")} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={e => handleCurrencyChange(e.target.value)}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition cursor-pointer"
                                    >
                                        <option value="EGP">🇪🇬 {t("Egyptian Pound (EGP)", "جنيه مصري (EGP)")}</option>
                                        <option value="SAR">🇸🇦 {t("Saudi Riyal (SAR)", "ريال سعودي (SAR)")}</option>
                                        <option value="USD">🇺🇸 {t("US Dollar (USD)", "دولار أمريكي (USD)")}</option>
                                        <option value="GOLD_24">🪙 {t("Gold 24K", "ذهب عيار 24")}</option>
                                        <option value="GOLD_21">🪙 {t("Gold 21K", "ذهب عيار 21")}</option>
                                        <option value="GOLD_18">🪙 {t("Gold 18K", "ذهب عيار 18")}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {formAssetInfo.isGold ? t("Weight in Grams", "الوزن بالجرام") : t("Currency Quantity", `المبلغ بـ (${formAssetInfo.unitLabel})`)} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number" step="0.01" required value={val} onChange={e => handleValChange(e.target.value)}
                                        placeholder={formAssetInfo.isGold ? "10.00" : "1310"}
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {formAssetInfo.isGold ? t("Gold Gram Rate (EGP)", "سعر الجرام بالمصري") : t("Exchange Rate (EGP)", "سعر الصرف بالمصري (Rate)")}
                                    </label>
                                    <input
                                        type="number" step="0.01" value={rate} onChange={e => handleRateChange(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-amber-600 dark:text-amber-400 placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                            </div>

                            {marketPrices && marketPrices.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">{t("Quick Benchmark Rates:", "أسعار السوق اللحظية:")}</span>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {marketPrices.slice(0, 6).map((mp) => (
                                            <button
                                                key={mp.id}
                                                type="button"
                                                onClick={() => handleRateChange(String(mp.price))}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-950/50 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 transition cursor-pointer"
                                            >
                                                {mp.name}: {parseFloat(mp.price).toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Purchase Cost (EGP)", "سعر الشراء الإجمالي (ج.م)")} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Current Value (EGP)", "القيمة الحالية الإجمالية (ج.م)")} <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                    />
                                    {val && rate && parseFloat(val) > 0 && parseFloat(rate) > 0 && (
                                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                            {parseFloat(val).toLocaleString()} × {parseFloat(rate).toLocaleString()} = {(parseFloat(val) * parseFloat(rate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Purchase Date", "التاريخ الميلادي")} <span className="text-red-500">*</span></label>
                                <input
                                    type="date" required value={gregorianDate} onChange={e => setGregorianDate(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Hijri Date", "التاريخ الهجري")}</label>
                                <input
                                    type="text" value={hijriDate} onChange={e => setHijriDate(e.target.value)}
                                    placeholder="dd-mm-yyyy"
                                    className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{t("Invoice Image", "صورة الفاتورة / الأصل")}</label>
                                <label className="block border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-5 text-center transition bg-zinc-50/40 dark:bg-zinc-900/30 cursor-pointer">
                                    <input
                                        type="file" accept="image/*" onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    {image ? (
                                        <div className="flex items-center justify-center gap-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={getMediaSrc(image)} alt="Preview" referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs" />
                                            <div className="text-left rtl:text-right">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white">{t("Invoice image attached", "تم إرفاق صورة الفاتورة")}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{t("Click to replace image", "اضغط لاستبدال الصورة")}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2.5 text-zinc-600 dark:text-zinc-300">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                {uploading ? t("Uploading image...", "جاري رفع الصورة...") : t("Drop your file here", "اسحب صورة الفاتورة هنا")}
                                            </p>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 mb-3">
                                                {t("PNG, JPG or WEBP receipt image", "صورة إيصال أو فاتورة بصيغة PNG أو JPG")}
                                            </p>
                                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 shadow-2xs">
                                                {t("Browse Files", "تصفح الملفات")}
                                            </span>
                                        </>
                                    )}
                                </label>
                            </div>

                            <SubCommentsInput
                                value={note}
                                onChange={setNote}
                                label={t("Notes / Sub-Comments", "الملاحظات / البنود الفرعية")}
                                placeholder={t("e.g. 1310 Saudi Riyal cash...", "مثال: 1310 ريال سعودي...")}
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
                                    {submitting ? t("Saving...", "جاري الحفظ...") : (editMode ? t("Save Changes", "حفظ التعديلات") : t("Add Asset", "تأكيد الإضافة"))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmId && (() => {
                const deletingAsset = (Array.isArray(goldAssets) ? goldAssets : []).find(a => a.id === deleteConfirmId);
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
                                            {t("Delete Gold Asset?", "هل تريد حذف هذا الأصل الذهبي؟")}
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
                            {deletingAsset && (
                                <div className="px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs flex justify-between items-center">
                                    <span className="font-bold text-zinc-900 dark:text-white">{deletingAsset.name}</span>
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {parseFloat(deletingAsset.amount || 0).toLocaleString()} EGP
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
