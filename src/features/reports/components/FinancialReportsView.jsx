'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/shared/context/AppContext.js';
import { Table, LayoutGrid, ChevronDown, ChevronRight, TrendingUp, TrendingDown, RefreshCw, DollarSign, Wallet, Shield, Layers, HelpCircle } from 'lucide-react';
import { fetchFinancialReportsData } from '@/features/reports/api/financialReports.api.js';
import { processMonthsData, getCurrentSheetRows } from '@/features/reports/utils/financialReports.logic.js';
import { extractDbYears, buildDynamicReportTabs } from '@/features/reports/constants/financialReports.constants.js';

const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export default function FinancialReportsView() {
    const { t } = useApp();

    const [activeSheet, setActiveSheet] = useState('الرئيسية');
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'sheet'));
    const [expandedYear, setExpandedYear] = useState(String(new Date().getFullYear()));
    const [expandedMonthId, setExpandedMonthId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState({ row: 1, col: 'A', val: '' });

    const [months, setMonths] = useState([]);
    const [credits, setCredits] = useState([]);
    const [debts, setDebts] = useState([]);
    const [goldAssets, setGoldAssets] = useState([]);
    const [prices, setPrices] = useState([]);

    const loadLiveData = async () => {
        setLoading(true);
        try {
            const data = await fetchFinancialReportsData();
            setMonths(data.months);
            setCredits(data.credits);
            setDebts(data.debts);
            setGoldAssets(data.goldAssets);
            setPrices(data.prices);
        } catch (err) {
            console.error('Error fetching live database data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialReportsData()
            .then(data => {
                setMonths(data.months);
                setCredits(data.credits);
                setDebts(data.debts);
                setGoldAssets(data.goldAssets);
                setPrices(data.prices);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching live database data:', err);
                setLoading(false);
            });
    }, []);

    const processedMonths = useMemo(() => {
        return processMonthsData(months, credits, debts);
    }, [months, credits, debts]);

    const reportTabs = useMemo(() => {
        return buildDynamicReportTabs(extractDbYears(months));
    }, [months]);

    const currentRows = useMemo(() => {
        return getCurrentSheetRows(activeSheet, processedMonths, credits, debts, goldAssets, prices);
    }, [activeSheet, processedMonths, credits, debts, goldAssets, prices]);

    const maxCols = useMemo(() => {
        if (!currentRows || currentRows.length === 0) return 7;
        const maxInRows = Math.max(...currentRows.map(r => (Array.isArray(r) ? r.length : 0)));
        return Math.max(maxInRows, 7);
    }, [currentRows]);

    const formulaText = useMemo(() => {
        if (selectedCell.val) {
            return `=DATABASE_CELL("${selectedCell.val}")`;
        }
        return `=MYSQL_${activeSheet}!${selectedCell.col}${selectedCell.row}`;
    }, [selectedCell, activeSheet]);

    const totals = useMemo(() => {
        const totalCreditsAllTime = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalDebtsAllTime = debts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const actualDebts = debts.filter(d => Number(d.type) === 1).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const invDebts = debts.filter(d => Number(d.type) === 2).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const otherDebts = debts.filter(d => Number(d.type) === 0 || ![1, 2].includes(Number(d.type))).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const netCash = totalCreditsAllTime - totalDebtsAllTime;
        const totalInvVal = goldAssets.reduce((sum, g) => sum + (parseFloat(g.amount) || 0), 0);
        return {
            totalCreditsAllTime,
            totalDebtsAllTime,
            actualDebts,
            invDebts,
            otherDebts,
            netCash,
            totalInvVal
        };
    }, [credits, debts, goldAssets]);

    const monthsByYear = useMemo(() => {
        const groups = {};
        processedMonths.forEach(m => {
            const yr = String(m.year || '2026');
            if (!groups[yr]) groups[yr] = [];
            groups[yr].push(m);
        });
        return groups;
    }, [processedMonths]);

    const availableYears = useMemo(() => {
        const yrs = Object.keys(monthsByYear).sort((a, b) => parseInt(b) - parseInt(a));
        return yrs.length > 0 ? yrs : ['2026'];
    }, [monthsByYear]);

    return (
        <div className="space-y-6 animate-fade-in pb-24 font-sans w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold tracking-tight text-zinc-950 dark:text-white">
                        {t("Financial Intelligence & Reports", "التقارير المالية التفصيلية")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t("Interactive financial ledger, multi-year sheets, and mobile summary cards.", "جداول التحليل المالي التفاعلية وملخصات السنوات والشهور")}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#161618] border border-[#E5E7EB] dark:border-zinc-800 px-4 py-2.5 rounded-xl text-sm font-mono shadow-xs">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                    <span className="font-bold text-zinc-400 select-none border-r border-zinc-200 dark:border-zinc-800 pr-3 min-w-[50px] text-base">
                        {selectedCell.col}{selectedCell.row}
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 italic select-none text-base">fx</span>
                    <input
                        type="text"
                        readOnly
                        value={formulaText}
                        className="bg-transparent text-zinc-900 dark:text-white w-full focus:outline-none font-mono font-bold text-xs sm:text-sm truncate"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <button
                            type="button"
                            onClick={() => setViewMode('sheet')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'sheet'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t("Sheet Grid", "جدول تفصيلي")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                viewMode === 'cards'
                                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-xs'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span>{t("Mobile Cards", "بطاقات ذكية")}</span>
                        </button>
                    </div>

                    <span className="hidden sm:inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Live DB Sync
                    </span>
                    <button
                        onClick={loadLiveData}
                        className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        title="Refresh Database Data"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Total Revenues (All-time)", "إجمالي الإيرادات (جميع الأوقات)")}
                            </span>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
                                {Math.round(totals.totalCreditsAllTime).toLocaleString()} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-medium block mt-1">
                                {credits.length} {t("credit items recorded", "بند إيرادات مسجل")}
                            </span>
                        </div>

                        <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Total Outflows (All-time)", "إجمالي التدفقات الخارجة (جميع الأوقات)")}
                            </span>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1 block">
                                {Math.round(totals.totalDebtsAllTime).toLocaleString()} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                            </span>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 space-y-0.5 font-mono">
                                <div>{t("Debts:", "ديون:")} <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(totals.actualDebts).toLocaleString()}</strong></div>
                                <div>{t("Investments:", "استثمارات:")} <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(totals.invDebts).toLocaleString()}</strong></div>
                                <div>{t("Others:", "مصروفات:")} <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(totals.otherDebts).toLocaleString()}</strong></div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Net Cash Balance", "الصافي النقدي المتاح")}
                            </span>
                            <span className={`text-xl font-extrabold font-mono tabular-nums mt-1 block ${totals.netCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                {Math.round(totals.netCash).toLocaleString()} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-1">
                                {t("Revenues minus Outflows", "فائض الإيرادات عن التدفقات")}
                            </span>
                        </div>

                        <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {t("Investments & Savings Value", "قيمة محفظة الاستثمارات")}
                            </span>
                            <span className="text-xl font-extrabold font-mono tabular-nums text-amber-500 mt-1 block">
                                {Math.round(totals.totalInvVal).toLocaleString()} <span className="text-xs text-zinc-400 font-sans">EGP</span>
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-1">
                                {t("Current gold & asset valuation", "التقييم السوقي لأصول الذهب")}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {availableYears.map(yr => (
                            <button
                                key={yr}
                                type="button"
                                onClick={() => setExpandedYear(yr)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                                    expandedYear === yr
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-[#161618] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                                }`}
                            >
                                <span>📅</span>
                                <span>{t("Year", "تقرير سنة")} {yr}</span>
                            </button>
                        ))}
                    </div>

                    {(() => {
                        const yearMonths = monthsByYear[expandedYear] || [];
                        const yearRevenue = yearMonths.reduce((sum, m) => sum + m.revenue, 0);
                        const yearLiability = yearMonths.reduce((sum, m) => sum + m.liabilities, 0);
                        const yearInvestment = yearMonths.reduce((sum, m) => sum + m.investments, 0);
                        const yearOther = yearMonths.reduce((sum, m) => sum + m.others, 0);
                        const yearOutflows = yearLiability + yearInvestment + yearOther;
                        const yearBalance = yearRevenue - yearOutflows;
                        const yearMargin = yearRevenue > 0 ? Math.round((yearBalance / yearRevenue) * 100) : 0;

                        return (
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-[#161618] border-2 border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-5 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span>📊</span>
                                            <span>{t("Annual Summary for", "الملخص السنوي لسنة")} {expandedYear}</span>
                                        </h3>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${yearBalance >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                            {t("Net Margin:", "نسبة الفائض:")} {yearMargin}%
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                                            <span className="text-zinc-400 block text-[11px] mb-0.5">{t("Revenues", "الإيرادات")}</span>
                                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{Math.round(yearRevenue).toLocaleString()} EGP</strong>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                                            <span className="text-zinc-400 block text-[11px] mb-0.5">{t("Total Outflows", "إجمالي التدفقات")}</span>
                                            <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">{Math.round(yearOutflows).toLocaleString()} EGP</strong>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                                            <span className="text-zinc-400 block text-[11px] mb-0.5">{t("Net Cash Flow", "صافي التدفق")}</span>
                                            <strong className={`font-mono text-sm ${yearBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                                {yearBalance >= 0 ? '+' : ''}{Math.round(yearBalance).toLocaleString()} EGP
                                            </strong>
                                        </div>
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60">
                                            <span className="text-zinc-400 block text-[11px] mb-0.5">{t("Actual Debts", "الديون المسددة")}</span>
                                            <strong className="text-zinc-800 dark:text-zinc-200 font-mono text-sm">{Math.round(yearLiability).toLocaleString()} EGP</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                                        {t("Monthly Breakdown", "تفاصيل الشهور")} ({yearMonths.length} {t("months", "شهور")})
                                    </h4>

                                    {yearMonths.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-400 text-xs bg-white dark:bg-[#161618] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                            {t("No monthly data recorded for this year.", "لا توجد شهور مسجلة لهذه السنة.")}
                                        </div>
                                    ) : (
                                        yearMonths.map(m => {
                                            const isExpanded = expandedMonthId === m.id;
                                            const netMonth = m.revenue - m.expenses;
                                            const isPositive = netMonth >= 0;

                                            return (
                                                <div
                                                    key={m.id}
                                                    className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs transition"
                                                >
                                                    <div
                                                        onClick={() => setExpandedMonthId(isExpanded ? null : m.id)}
                                                        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                                                                {m.month ? String(m.month).slice(0, 3) : 'M'}
                                                            </div>
                                                            <div>
                                                                <h5 className="font-bold text-sm text-zinc-900 dark:text-white">
                                                                    {m.month} {m.year}
                                                                </h5>
                                                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                                                                    <span>+{Math.round(m.revenue).toLocaleString()}</span>
                                                                    <span>•</span>
                                                                    <span>-{Math.round(m.expenses).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tabular-nums ${
                                                                isPositive 
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            }`}>
                                                                {isPositive ? '+' : ''}{Math.round(netMonth).toLocaleString()} ({m.percentage}%)
                                                            </span>
                                                            <div className="text-zinc-400">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3 text-xs">
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                                                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                                                    <span className="text-[10px] text-zinc-400 block">{t("Opening Balance", "الرصيد الافتتاحي")}</span>
                                                                    <strong className="font-mono text-zinc-900 dark:text-white">{Math.round(m.opening_balance).toLocaleString()}</strong>
                                                                </div>
                                                                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                                                    <span className="text-[10px] text-zinc-400 block">{t("Closing Balance", "الرصيد الختامي")}</span>
                                                                    <strong className="font-mono text-zinc-900 dark:text-white">{Math.round(m.closing_balance).toLocaleString()}</strong>
                                                                </div>
                                                                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                                                    <span className="text-[10px] text-zinc-400 block">{t("Liabilities (Debts)", "الديون الفعلية")}</span>
                                                                    <strong className="font-mono text-rose-600">{Math.round(m.liabilities).toLocaleString()}</strong>
                                                                </div>
                                                                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
                                                                    <span className="text-[10px] text-zinc-400 block">{t("Investments & Others", "استثمارات ومصروفات")}</span>
                                                                    <strong className="font-mono text-amber-600">{Math.round(m.investments + m.others).toLocaleString()}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-md overflow-hidden flex flex-col min-h-[650px]">
                    <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[680px] select-none">
                        {loading ? (
                            <div className="flex items-center justify-center h-80 text-zinc-400 text-sm font-mono animate-pulse">
                                Calculating Database Formulas...
                            </div>
                        ) : (
                            <table className="w-full border-collapse text-sm font-mono text-left table-auto">
                                <thead>
                                    <tr className="bg-zinc-100 dark:bg-[#1E1E22] text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                                        <th className="w-10 p-2 text-center font-black text-xs border-r border-zinc-200 dark:border-zinc-800 bg-zinc-200/70 dark:bg-zinc-800/70 sticky top-0 start-0 z-20">
                                            #
                                        </th>
                                        {Array.from({ length: maxCols }).map((_, colIdx) => {
                                            const letter = COLUMN_LETTERS[colIdx] || `C${colIdx + 1}`;
                                            return (
                                                <th
                                                    key={colIdx}
                                                    className="p-2 border-r border-zinc-200 dark:border-zinc-800 font-extrabold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 sticky top-0 bg-zinc-100 dark:bg-[#1E1E22] z-10"
                                                >
                                                    {letter}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                                    {currentRows.map((rowArray, rIdx) => {
                                        const rowNum = rIdx + 1;
                                        const rowText = Array.isArray(rowArray) ? rowArray.join(' ') : '';
                                        
                                        const isTitleRow = rowText.includes('Financial Analysis Report Detailed') || rowText.includes('تقرير التحليل المالي المفصل');
                                        const isSummaryCardHeaders = rowText.includes('Credits') && (rowText.includes('Outflows') || rowText.includes('Debt')) && rowText.includes('Cash');
                                        const isSummaryCardValues = rIdx === 2 && currentRows[1] && String(currentRows[1][0]).includes('Credits');
                                        const isSectionHeader = rowText.includes('إجمالي التقرير المالي') || rowText.includes('تفاصيل الأشهر') || rowText.includes('حقيبة الاستثمار');
                                        const isMonthHeader = rowText.includes('شهر:');
                                        const isTableSubHeader = rowText.includes('السنة / Year') || rowText.includes('السنة والشهر') || rowText.includes('المكاسب') || rowText.includes('المصروفات') || rowText.includes('اسم البند');
                                        const isTotalRow = rowText.includes('الإجمالي') || rowText.includes('إجمالي') || rowText.includes('معادلة الحساب');

                                        let rowBgClass = "hover:bg-[#BC5C29]/15 dark:hover:bg-[#BC5C29]/10";
                                        if (isTitleRow) {
                                            rowBgClass = "bg-white dark:bg-[#161618] text-right font-black text-lg text-zinc-900 dark:text-white border-b-2 border-zinc-300 dark:border-zinc-700 py-3";
                                        } else if (isSectionHeader || isMonthHeader) {
                                            rowBgClass = "bg-[#BC5C29]/10 font-black text-[#9C4D31] dark:text-[#BC5C29] border-y-2 border-[#BC5C29]/50 dark:border-[#BC5C29]/25 text-sm sm:text-base shadow-2xs";
                                        } else if (isTableSubHeader) {
                                            rowBgClass = "bg-zinc-100 dark:bg-zinc-900 font-black text-zinc-900 dark:text-white text-xs sm:text-sm border-b border-zinc-300 dark:border-zinc-700";
                                        } else if (isTotalRow) {
                                            rowBgClass = "bg-emerald-100/80 dark:bg-emerald-950/70 font-black text-emerald-950 dark:text-emerald-100 border-y-2 border-emerald-400 dark:border-emerald-700 text-sm sm:text-base";
                                        }

                                        return (
                                            <tr key={rIdx} className={`transition-colors ${rowBgClass}`}>
                                                <td className="p-2 text-center font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100/90 dark:bg-zinc-900/90 border-r border-zinc-200 dark:border-zinc-800 select-none sticky start-0 z-10 text-xs">
                                                    {rowNum}
                                                </td>

                                                {Array.from({ length: maxCols }).map((_, cIdx) => {
                                                    const cellVal = Array.isArray(rowArray) ? (rowArray[cIdx] !== undefined ? String(rowArray[cIdx]) : '') : '';
                                                    const colLetter = COLUMN_LETTERS[cIdx] || `C${cIdx + 1}`;
                                                    const isSelected = selectedCell.row === rowNum && selectedCell.col === colLetter;

                                                    const isNum = !isNaN(parseFloat(cellVal.replace(/,/g, '').replace(/ EGP/g, '').replace(/ جرام/g, '')));

                                                    let cellStyle = "text-zinc-900 dark:text-zinc-100";

                                                    if (isSummaryCardHeaders || isSummaryCardValues) {
                                                        if (cIdx === 0) cellStyle = "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-black text-center text-sm border-emerald-300 dark:border-emerald-800";
                                                        else if (cIdx === 1) cellStyle = "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 font-black text-center text-sm border-rose-300 dark:border-rose-800";
                                                        else if (cIdx === 2) cellStyle = "bg-[#BC5C29]/10 text-[#9C4D31] dark:text-[#BC5C29] font-black text-center text-sm border-[#BC5C29]/50 dark:border-[#BC5C29]/25";
                                                        else if (cIdx === 3) cellStyle = "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 font-black text-center text-sm border-amber-300 dark:border-amber-800";
                                                        else if (cIdx === 4) cellStyle = "bg-yellow-100 dark:bg-yellow-950/80 text-yellow-900 dark:text-yellow-200 font-black text-center text-sm border-yellow-300 dark:border-yellow-800";
                                                        else if (cIdx === 5) cellStyle = "bg-[#BC5C29]/10 text-[#9C4D31] dark:text-[#BC5C29] font-black text-center text-sm border-[#BC5C29]/50 dark:border-[#BC5C29]/25";
                                                        else if (cIdx === 6) cellStyle = "bg-[#BC5C29]/10 text-[#9C4D31] dark:text-[#BC5C29] font-black text-center text-sm border-[#BC5C29]/50 dark:border-[#BC5C29]/25";
                                                    } else if (isTitleRow) {
                                                        cellStyle = "font-black text-base sm:text-lg text-zinc-900 dark:text-white";
                                                    } else if (isSectionHeader || isMonthHeader) {
                                                        cellStyle = "text-[#9C4D31] dark:text-[#BC5C29] font-black text-sm sm:text-base";
                                                    } else if (isTableSubHeader) {
                                                        cellStyle = "text-zinc-900 dark:text-white font-extrabold text-xs sm:text-sm";
                                                    } else if (isTotalRow) {
                                                        cellStyle = "text-emerald-800 dark:text-emerald-300 font-black text-sm sm:text-base";
                                                    } else if (cIdx === 1 && isNum) {
                                                        cellStyle = "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm sm:text-base";
                                                    } else if (cIdx === 4 && isNum) {
                                                        cellStyle = "bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-extrabold text-sm sm:text-base";
                                                    } else if (activeSheet.includes('ذهب') && isNum) {
                                                        cellStyle = "bg-amber-50/60 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-extrabold text-sm sm:text-base";
                                                    } else if (isNum) {
                                                        cellStyle = "font-bold text-sm sm:text-base text-zinc-900 dark:text-white";
                                                    }

                                                    return (
                                                        <td
                                                            key={cIdx}
                                                            onClick={() => setSelectedCell({ row: rowNum, col: colLetter, val: cellVal })}
                                                            className={`px-2.5 py-2 border-r border-zinc-200 dark:border-zinc-800 transition cursor-pointer font-mono text-sm leading-snug break-words ${
                                                                isNum && !isSummaryCardHeaders ? 'text-right' : 'text-left'
                                                            } ${
                                                                isSelected 
                                                                    ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-100/80 dark:bg-emerald-950/60 font-black shadow-xs' 
                                                                    : ''
                                                            } ${cellStyle}`}
                                                        >
                                                            {cellVal}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="bg-zinc-100 dark:bg-[#1A1A1E] border-t border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 overflow-x-auto">
                            {reportTabs.map((tab) => {
                                const active = activeSheet === tab.name;
                                return (
                                    <button
                                        key={tab.name}
                                        type="button"
                                        onClick={() => setActiveSheet(tab.name)}
                                        className={`px-3.5 py-1.5 rounded-t-xl text-xs sm:text-sm font-mono font-extrabold transition flex items-center gap-2 border-t border-x shrink-0 ${
                                            active 
                                                ? `bg-white dark:bg-[#161618] text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700 shadow-sm translate-y-[1px] ${tab.color}` 
                                                : `bg-zinc-200/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800`
                                        }`}
                                    >
                                        <span className="text-base">{tab.icon}</span>
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400 select-none">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">DATABASE ACTIVE</span>
                            <span className="opacity-40">•</span>
                            <span>Sheet: <strong className="text-zinc-900 dark:text-white">{activeSheet}</strong></span>
                            <span className="opacity-40">•</span>
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">{currentRows.length} Rows</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-[#161618] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                    <span>{t("Financial Definitions & Cash Flow Formulas", "توضيح المصطلحات والمعادلات المالية")}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] sm:text-xs">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <strong className="text-zinc-900 dark:text-zinc-200 block mb-1">
                            {t("Total Outflows = Debts + Investments + Other Expenses", "إجمالي التدفقات الخارجة = الديون + الاستثمارات + المصروفات")}
                        </strong>
                        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            {t("Aggregates all payments leaving the account across personal debts, gold/asset investments, and general expenses.", "يمثل إجمالي السيولة التي خرجت، مفصّلة بين التزامات ديون فعلية، استثمارات ومدخرات، ومصروفات دورية.")}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <strong className="text-zinc-900 dark:text-zinc-200 block mb-1">
                            {t("Net Cash Flow = Revenues - Total Outflows", "صافي التدفق النقدي = الإيرادات - إجمالي التدفقات")}
                        </strong>
                        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                            {t("Reflects the actual cash surplus or deficit during the period (Net Margin %).", "يوضح الفائض النقدي أو العجز الفعلي خلال الفترة مع نسبة الفائض المئوية.")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
