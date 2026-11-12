'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from '@/shared/next-compat/link';
import { useApp } from '@/shared/context/AppContext.jsx';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    Wallet,
    Target,
    Scale,
    Shield,
    ArrowUpRight,
    Coins,
    BarChart3,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Grid,
    ArrowRight,
    Layers
} from 'lucide-react';

import { fetchFinanceStats, fetchMonthsData } from '@/shared/api/overview.api.js';
import {
    getAvailableTimelineYears,
    filterTimelineMonths,
    calculateTimelineLedgerStats,
    filterCashFlowData,
    calculateTopExpenses,
    calculateTopDebts,
    getActiveMonths,
    generateSparklineRevenue,
    generateSparklineDebts,
    generateSparklineInvestments,
    generateSparklineOthers,
    generateSparklineBalance,
    generateSparklineGoldWeight,
    generateSparklineGoldCost,
    generateSparklineGoldVal,
    generateSparklineTotalVal,
    generateSparklineProfit
} from '@/shared/utils/overview.logic.js';
import PeriodSelector, { getPeriodRange, isInPeriod } from '@/components/ui/PeriodSelector';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { I18N_KEYS } from '@/shared/enums';
import StatCard from '@/features/treasury/components/StatCard';
import { Button } from '@/components/ui/button';

let cachedOverviewPayload = null;
let cachedMonthsPayload = null;

export default function DashboardHome() {
    const { t, setActiveDashboard } = useApp();
    const [data, setData] = useState(() => cachedOverviewPayload);
    const [loading, setLoading] = useState(() => !cachedOverviewPayload);

    const [timeRange, setTimeRange] = useState('12');
    const [chartViewMode, setChartViewMode] = useState('detailed');
    const [disabledChartKeys, setDisabledChartKeys] = useState({});
    const [metricFocus, setMetricFocus] = useState('all');

    const [statsPeriod, setStatsPeriod] = useState('month');

    const [monthsList, setMonthsList] = useState(() => cachedMonthsPayload || []);
    const [selectedTimelineYear, setSelectedTimelineYear] = useState('All');
    const [timelineViewMode, setTimelineViewMode] = useState('carousel');
    const timelineScrollRef = useRef(null);

    const availableTimelineYears = useMemo(() => getAvailableTimelineYears(monthsList), [monthsList]);
    const filteredTimelineMonths = useMemo(() => filterTimelineMonths(monthsList, selectedTimelineYear), [monthsList, selectedTimelineYear]);
    const timelineLedgerStats = useMemo(() => calculateTimelineLedgerStats(filteredTimelineMonths), [filteredTimelineMonths]);

    const scrollTimeline = (direction) => {
        if (timelineScrollRef.current) {
            const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
            const delta = direction === 'left' ? -340 : 340;
            timelineScrollRef.current.scrollBy({ left: isRtl ? -delta : delta, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        setActiveDashboard('money');
        fetchFinanceStats()
            .then(payload => {
                cachedOverviewPayload = payload;
                setData(payload);
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });

        fetchMonthsData()
            .then(list => {
                const resolved = Array.isArray(list) ? list : (list?.data || []);
                cachedMonthsPayload = resolved;
                setMonthsList(resolved);
            })
            .catch(err => console.error(err));
    }, [setActiveDashboard]);

    const stats = useMemo(() => data?.stats || {}, [data]);
    const chartData = useMemo(() => data?.chartData || [], [data]);
    const expenseDistribution = useMemo(() => data?.expenseDistribution || [], [data]);
    const liabilityDistribution = useMemo(() => data?.liabilityDistribution || [], [data]);

    const filteredCashFlowData = useMemo(() => filterCashFlowData(chartData, timeRange), [chartData, timeRange]);

    const chartSummaryTotals = useMemo(() => {
        let rev = 0, deb = 0, inv = 0, oth = 0;
        filteredCashFlowData.forEach(item => {
            rev += Number(item.credits || 0);
            deb += Number(item.debts || 0);
            inv += Number(item.investments || 0);
            oth += Number(item.others || 0);
        });
        const totalOut = deb + inv + oth;
        return { rev, deb, inv, oth, totalOut, netCash: rev - totalOut };
    }, [filteredCashFlowData]);

    const topExpensesData = useMemo(() => calculateTopExpenses(expenseDistribution, data?.othersDistribution), [expenseDistribution, data]);
    const topDebtsData = useMemo(() => calculateTopDebts(liabilityDistribution, stats, t("Personal Loans", "القروض والالتزامات")), [liabilityDistribution, stats, t]);
    const activeMonths = useMemo(() => getActiveMonths(chartData), [chartData]);

    const sparklineRevenue = useMemo(() => generateSparklineRevenue(activeMonths), [activeMonths]);
    const sparklineDebts = useMemo(() => generateSparklineDebts(activeMonths), [activeMonths]);
    const sparklineInvestments = useMemo(() => generateSparklineInvestments(activeMonths), [activeMonths]);
    const sparklineOthers = useMemo(() => generateSparklineOthers(activeMonths), [activeMonths]);
    const sparklineBalance = useMemo(() => generateSparklineBalance(activeMonths), [activeMonths]);
    const sparklineGoldWeight = useMemo(() => generateSparklineGoldWeight(activeMonths), [activeMonths]);
    const sparklineGoldCost = useMemo(() => generateSparklineGoldCost(activeMonths), [activeMonths]);
    const sparklineGoldVal = useMemo(() => generateSparklineGoldVal(activeMonths), [activeMonths]);
    const sparklineTotalVal = useMemo(() => generateSparklineTotalVal(activeMonths), [activeMonths]);
    const sparklineProfit = useMemo(() => generateSparklineProfit(activeMonths), [activeMonths]);

    const statsPeriodRange = useMemo(() => getPeriodRange(statsPeriod), [statsPeriod]);

    const periodChartData = useMemo(() => {
        if (!statsPeriodRange) return chartData;
        const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        return chartData.filter(item => {
            if (!item.name) return true;
            const parts = String(item.name).trim().split(' ');
            const mName = (parts[0] || '').toLowerCase();
            const yr = parseInt(parts[1], 10);
            const mIdx = monthNames.indexOf(mName);
            if (isNaN(yr) || mIdx === -1) return true;
            const itemDate = new Date(yr, mIdx, 1);
            return itemDate >= statsPeriodRange.start && itemDate <= statsPeriodRange.end;
        });
    }, [chartData, statsPeriodRange]);

    const periodStats = useMemo(() => {
        let rev = 0, deb = 0, inv = 0, oth = 0;
        periodChartData.forEach(item => {
            rev += Number(item.credits || 0);
            deb += Number(item.debts || 0);
            inv += Number(item.investments || 0);
            oth += Number(item.others || 0);
        });
        return { rev, deb, inv: inv, oth, totalOut: deb + inv + oth, net: rev - (deb + inv + oth) };
    }, [periodChartData]);

    const periodSublabel = statsPeriod === 'all'
        ? t("All-time total", "إجمالي جميع الأوقات")
        : t("Selected period", "الفترة المحددة");

    const tooltipStyle = {
        backgroundColor: 'rgba(12, 12, 18, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(189, 173, 75, 0.3)',
        borderRadius: '14px',
        fontSize: '11px',
        color: '#FFFBF7',
        padding: '10px 14px',
        boxShadow: '0 16px 48px 0 rgba(0,0,0,0.6)'
    };

    if (loading) {
        return <PageDashboardSkeleton kpiCount={8} />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <span className="text-2xl">💎</span>
                        <span>{t("Financial Intelligence & Overview", "لوحة الميزانية والذكاء المالي")}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                        {t(
                            "Real-time personal balance sheet, net cash flow, assets valuation, and debt tracking.",
                            "نظرة شمولية موحدة لصافي الثروة، التدفق النقدي، تقييم مدخرات الذهب، ومتابعة سداد الالتزامات."
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button variant="secondary" size="default" asChild className="cursor-pointer">
                        <Link href="/Timeline">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{t(I18N_KEYS.TREASURY_MONTHLY_LEDGER, "سجل الشهور")}</span>
                        </Link>
                    </Button>
                    <Button variant="secondary" size="default" asChild className="cursor-pointer text-primary border-primary/30 bg-primary/8 hover:bg-primary/14">
                        <Link href="/Reserves">
                            <Coins className="w-3.5 h-3.5 shrink-0" />
                            <span>{t(I18N_KEYS.TREASURY_GOLD_AND_ASSETS, "الذهب والأصول")}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                        {t("Global Financial Overview", "إحصائيات الميزانية العامة")}
                    </p>
                    <PeriodSelector value={statsPeriod} onChange={setStatsPeriod} t={t} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                    <StatCard
                        icon={<DollarSign size={15} strokeWidth={2.5} />}
                        iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
                        label={t("Revenue", "الإيرادات")}
                        sublabel={periodSublabel}
                        value={Math.round(periodStats.rev).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-emerald-600 dark:text-emerald-400"
                        sparklineData={sparklineRevenue} sparklineColor="#10B981" gradientId="gradRevAT"
                    />
                    <StatCard
                        icon={<CreditCard size={15} strokeWidth={2.5} />}
                        iconBg="bg-rose-500/10" iconColor="text-rose-600 dark:text-rose-400"
                        label={t("Debts", "الديون والالتزامات")}
                        sublabel={periodSublabel}
                        value={Math.round(periodStats.deb).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-rose-600 dark:text-rose-400"
                        sparklineData={sparklineDebts} sparklineColor="#EF4444" gradientId="gradDebtAT"
                    />
                    <StatCard
                        icon={<TrendingUp size={15} strokeWidth={2.5} />}
                        iconBg="bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
                        label={t("Investments", "الاستثمارات والذهب")}
                        sublabel={periodSublabel}
                        value={Math.round(periodStats.inv).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-amber-600 dark:text-amber-400"
                        sparklineData={sparklineInvestments} sparklineColor="#F59E0B" gradientId="gradInvAT"
                    />
                    <StatCard
                        icon={<Wallet size={15} strokeWidth={2.5} />}
                        iconBg="bg-sky-500/10" iconColor="text-sky-600 dark:text-sky-400"
                        label={t("Other Expenses", "مصاريف أخرى")}
                        sublabel={periodSublabel}
                        value={Math.round(periodStats.oth).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-sky-600 dark:text-sky-400"
                        sparklineData={sparklineOthers} sparklineColor="#0EA5E9" gradientId="gradOtherAT"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    {t("Current Year Performance Statistics", "مؤشرات الأداء المالي للعام الجاري")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    <StatCard
                        icon={<DollarSign size={15} strokeWidth={2.5} />}
                        iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
                        label={t("CY Revenue", "إيرادات العام")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalCreditsCY || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-emerald-600 dark:text-emerald-400"
                        sparklineData={sparklineRevenue} sparklineColor="#10B981" gradientId="gradRevCY"
                    />
                    <StatCard
                        icon={<CreditCard size={15} strokeWidth={2.5} />}
                        iconBg="bg-rose-500/10" iconColor="text-rose-600 dark:text-rose-400"
                        label={t("CY Debts", "ديون العام")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalDebtAmountCY || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-rose-600 dark:text-rose-400"
                        sparklineData={sparklineDebts} sparklineColor="#EF4444" gradientId="gradDebtCY"
                    />
                    <StatCard
                        icon={<TrendingUp size={15} strokeWidth={2.5} />}
                        iconBg="bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
                        label={t("CY Investments", "استثمارات العام")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalInvestmentAmountCY || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-amber-600 dark:text-amber-400"
                        sparklineData={sparklineInvestments} sparklineColor="#F59E0B" gradientId="gradInvCY"
                    />
                    <StatCard
                        icon={<Wallet size={15} strokeWidth={2.5} />}
                        iconBg="bg-zinc-500/10" iconColor="text-zinc-600 dark:text-zinc-400"
                        label={t("CY Other Expenses", "مصاريف أخرى للعام")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalOtherAmountCY || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-zinc-900 dark:text-zinc-300"
                        sparklineData={sparklineOthers} sparklineColor="#888" gradientId="gradOtherCY"
                    />
                    <StatCard
                        icon={<Wallet size={15} strokeWidth={2.5} />}
                        iconBg="bg-[#BC5C29]/10" iconColor="text-[#BC5C29]"
                        label={t("Current Balance", "الرصيد المتاح")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.currentBalance || 0).toLocaleString()}
                        valueCurrency="EGP"
                        valueColor={(stats.currentBalance || 0) >= 0 ? 'text-[#BC5C29]' : 'text-rose-600 dark:text-rose-400'}
                        sparklineData={sparklineBalance} sparklineColor="#3B82F6" gradientId="gradBalCY"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[11px] font-bold text-[#BC5C29]/70 uppercase tracking-widest">
                    {t("Investments & Savings Summary", "ملخص الاستثمارات والمدخرات")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    <StatCard
                        icon={<Scale size={15} strokeWidth={2.5} />}
                        iconBg="bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
                        label={t("Gold Weight (21K Std)", "وزن الذهب (معادل عيار 21)")}
                        sublabel={`${t("Raw:", "خام:")} ${Number(stats.totalRawGoldWeight || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${t("g", "جرام")}`}
                        value={Number(stats.totalGoldWeight || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        valueCurrency={t("g (21K)", "جرام (21)")} valueColor="text-amber-600 dark:text-amber-400"
                        sparklineData={sparklineGoldWeight} sparklineColor="#F59E0B" gradientId="gradGoldW"
                    />
                    <StatCard
                        icon={<Shield size={15} strokeWidth={2.5} />}
                        iconBg="bg-zinc-500/10" iconColor="text-zinc-600 dark:text-zinc-400"
                        label={t("Gold Purchase Cost", "تكلفة شراء الذهب")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalGoldPrice || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-zinc-900 dark:text-zinc-300"
                        sparklineData={sparklineGoldCost} sparklineColor="#888" gradientId="gradGoldC"
                    />
                    <StatCard
                        icon={<Coins size={15} strokeWidth={2.5} />}
                        iconBg="bg-amber-500/10" iconColor="text-amber-600 dark:text-amber-400"
                        label={t("Gold Current Valuation", "القيمة الحالية للذهب")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={Math.round(stats.totalGoldAmount || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-amber-600 dark:text-amber-400"
                        sparklineData={sparklineGoldVal} sparklineColor="#F59E0B" gradientId="gradGoldV"
                    />
                    <StatCard
                        icon={<TrendingUp size={15} strokeWidth={2.5} />}
                        iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
                        label={t("Total Portfolio Value", "إجمالي المحفظة الشاملة")}
                        sublabel={`${t("Gold:", "ذهب:")} ${Math.round(stats.totalGoldAmount || 0).toLocaleString()} + ${t("Other:", "أخرى:")} ${Math.round(Math.max(0, (stats.totalInvestmentsAmount || 0) - (stats.totalGoldAmount || 0))).toLocaleString()}`}
                        value={Math.round(stats.totalInvestmentsAmount || 0).toLocaleString()}
                        valueCurrency="EGP" valueColor="text-emerald-600 dark:text-emerald-400"
                        sparklineData={sparklineTotalVal} sparklineColor="#10B981" gradientId="gradTotalV"
                    />
                    <StatCard
                        icon={<ArrowUpRight size={15} strokeWidth={2.5} />}
                        iconBg="bg-emerald-500/10" iconColor="text-emerald-600 dark:text-emerald-400"
                        label={t("Total Investments Profit", "إجمالي أرباح المحفظة")}
                        sublabel={t("Since start of current year", "من بداية العام الحالي")}
                        value={`${(stats.totalInvestmentsProfit || 0) >= 0 ? '+' : ''}${Math.round(stats.totalInvestmentsProfit || 0).toLocaleString()}`}
                        valueCurrency="EGP"
                        valueColor={(stats.totalInvestmentsProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                        sparklineData={sparklineProfit}
                        sparklineColor={(stats.totalInvestmentsProfit || 0) >= 0 ? '#10B981' : '#EF4444'}
                        gradientId="gradProfit"
                    />
                </div>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/80 backdrop-blur-2xl shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{t("Monthly Cash Flow Comparison (Revenue vs Outflow)", "مقارنة التدفق المالي الشهري (الدخل مقابل المصروفات)")}</span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {t("Direct visual breakdown of monthly revenue and individual expense categories.", "مقارنة مباشرة للإيرادات وأعمدة بنود المصروفات.")}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold">
                            {[
                                { key: 'all', label: t(I18N_KEYS.COMMON_ALL, "الكل"), active: 'bg-zinc-800 dark:bg-zinc-700 text-white', inactive: 'text-zinc-600 dark:text-zinc-400' },
                                { key: 'credits', label: t(I18N_KEYS.TREASURY_REV, "دخل"), active: 'bg-emerald-500 text-white', inactive: 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400' },
                                { key: 'debts', label: t(I18N_KEYS.TREASURY_DEBTS_SHORT, "ديون"), active: 'bg-rose-500 text-white', inactive: 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400' },
                                { key: 'investments', label: t(I18N_KEYS.TREASURY_INVEST_SHORT, "استثمار"), active: 'bg-amber-500 text-white', inactive: 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400' },
                                { key: 'others', label: t(I18N_KEYS.TREASURY_OTHER_SHORT, "أخرى"), active: 'bg-sky-500 text-white', inactive: 'text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400' },
                            ].map(btn => (
                                <button
                                    key={btn.key}
                                    onClick={() => setMetricFocus(btn.key)}
                                    aria-pressed={metricFocus === btn.key}
                                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer min-h-[32px] ${metricFocus === btn.key ? btn.active : btn.inactive}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold">
                            {[
                                { key: 'detailed', label: t(I18N_KEYS.TREASURY_BY_TYPE, "أعمدة كل نوع") },
                                { key: 'total', label: t(I18N_KEYS.COMMON_TOTAL, "الإجمالي") },
                            ].map(btn => (
                                <button
                                    key={btn.key}
                                    onClick={() => setChartViewMode(btn.key)}
                                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${chartViewMode === btn.key ? 'bg-zinc-800 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold">
                            {[
                                { key: '6', label: t(I18N_KEYS.TREASURY_SIX_MONTHS, "6 أشهر") },
                                { key: '12', label: t(I18N_KEYS.TREASURY_TWELVE_MONTHS, "12 شهراً") },
                                { key: 'all', label: t(I18N_KEYS.COMMON_ALL, "الكل") },
                            ].map(btn => (
                                <button
                                    key={btn.key}
                                    onClick={() => setTimeRange(btn.key)}
                                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${timeRange === btn.key ? 'bg-zinc-800 dark:bg-zinc-700 text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredCashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={55} />
                            <Tooltip
                                cursor={{ fill: 'rgba(189, 173, 75, 0.06)', rx: 6 }}
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: '#FFFBF7', fontWeight: 600 }}
                                labelStyle={{ color: '#BC5C29', fontWeight: 800, marginBottom: '4px' }}
                                formatter={(val, name) => [`${Number(val).toLocaleString()} EGP`, name]}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                                onClick={(entry) => entry?.dataKey && setDisabledChartKeys(prev => ({ ...prev, [entry.dataKey]: !prev[entry.dataKey] }))}
                                formatter={(value, entry) => (
                                    <span className={`cursor-pointer transition select-none ${disabledChartKeys[entry.dataKey] ? 'line-through opacity-30' : 'font-semibold text-zinc-600 dark:text-zinc-300'}`}>
                                        {value}
                                    </span>
                                )}
                            />
                            {chartViewMode === 'detailed' ? (
                                <>
                                    <Bar dataKey="credits" name={t("Revenue", "الإيرادات")} fill="#10B981" radius={[4, 4, 0, 0]} barSize={11} hide={disabledChartKeys['credits'] || (metricFocus !== 'all' && metricFocus !== 'credits')} />
                                    <Bar dataKey="debts" name={t("Debts", "الديون والالتزامات")} fill="#EF4444" radius={[4, 4, 0, 0]} barSize={11} hide={disabledChartKeys['debts'] || (metricFocus !== 'all' && metricFocus !== 'debts')} />
                                    <Bar dataKey="investments" name={t("Investments", "الاستثمارات والذهب")} fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={11} hide={disabledChartKeys['investments'] || (metricFocus !== 'all' && metricFocus !== 'investments')} />
                                    <Bar dataKey="others" name={t("Other Expenses", "مصاريف أخرى")} fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={11} hide={disabledChartKeys['others'] || (metricFocus !== 'all' && metricFocus !== 'others')} />
                                </>
                            ) : (
                                <>
                                    <Bar dataKey="credits" name={t("Total Revenue", "إجمالي الإيرادات")} fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} hide={disabledChartKeys['credits'] || (metricFocus !== 'all' && metricFocus !== 'credits')} />
                                    <Bar dataKey="totalExpenses" name={t("Total Outflows", "إجمالي المصروفات")} fill="#EF4444" radius={[6, 6, 0, 0]} barSize={20} hide={disabledChartKeys['totalExpenses'] || (metricFocus !== 'all' && metricFocus === 'credits')} />
                                </>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                        { label: t("Period Revenue", "إيرادات الفترة"), value: chartSummaryTotals.rev, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: t("Period Debts", "ديون الفترة"), value: chartSummaryTotals.deb, color: 'text-rose-600 dark:text-rose-400' },
                        { label: t("Period Investments", "استثمارات الفترة"), value: chartSummaryTotals.inv, color: 'text-amber-600 dark:text-amber-400' },
                        { label: t("Other Expenses", "مصاريف أخرى"), value: chartSummaryTotals.oth, color: 'text-sky-600 dark:text-sky-400' },
                        { label: t("Total Outflows", "إجمالي التدفقات"), value: chartSummaryTotals.totalOut, color: 'text-rose-600 dark:text-rose-400' },
                        { label: t("Net Cash Flow", "صافي التدفق"), value: chartSummaryTotals.netCash, color: chartSummaryTotals.netCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' },
                    ].map((item, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/40">
                            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block truncate mb-0.5">{item.label}</span>
                            <span className={`text-xs sm:text-sm font-black ${item.color} font-mono tabular-nums`}>
                                {Math.round(item.value).toLocaleString()} <span className="text-[10px] font-normal">EGP</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/80 backdrop-blur-2xl shadow-lg space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#BC5C29]" />
                            <span>{t("Top Expense Categories", "أعلى تصنيفات المصروفات")}</span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {t("Descending volume of spending by category.", "ترتيب تنازلي لبنود الإنفاق الأكثر استهلاكاً.")}
                        </p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={topExpensesData} margin={{ top: 5, right: 20, left: 8, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(14, 165, 233, 0.06)', rx: 6 }}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ color: '#FFFBF7', fontWeight: 600 }}
                                    labelStyle={{ color: '#BC5C29', fontWeight: 800, marginBottom: '2px' }}
                                    formatter={(val) => [`${Number(val).toLocaleString()} EGP`, t('Amount', 'المبلغ')]}
                                />
                                <Bar dataKey="amount" fill="#0EA5E9" radius={[0, 8, 8, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {topExpensesData?.length > 0 && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/50 space-y-1 sm:hidden">
                            {topExpensesData.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">{item.name}</span>
                                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">{Number(item.amount).toLocaleString()} EGP</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/80 backdrop-blur-2xl shadow-lg space-y-4">
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                            <span>{t("Debt & Liability Obligations", "الالتزامات والديون المتبقية")}</span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {t("Outstanding debt balances by category.", "توزيع الأرصدة والالتزامات المالية الواجبة.")}
                        </p>
                    </div>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={topDebtsData} margin={{ top: 5, right: 20, left: 8, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(239, 68, 68, 0.06)', rx: 6 }}
                                    contentStyle={tooltipStyle}
                                    itemStyle={{ color: '#FFFBF7', fontWeight: 600 }}
                                    labelStyle={{ color: '#BC5C29', fontWeight: 800, marginBottom: '2px' }}
                                    formatter={(val) => [`${Number(val).toLocaleString()} EGP`, t('Outstanding', 'المتبقي')]}
                                />
                                <Bar dataKey="amount" fill="#EF4444" radius={[0, 8, 8, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {topDebtsData?.length > 0 && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/50 space-y-1 sm:hidden">
                            {topDebtsData.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">{item.name}</span>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{Number(item.amount).toLocaleString()} EGP</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/80 backdrop-blur-2xl rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/60 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#BC5C29]/10 text-[#BC5C29]">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <span>{t("Months Timeline Ledger", "سجل أداء الشهور الزمني")}</span>
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg font-mono">
                                    {filteredTimelineMonths.length} {t("Months", "شهر")}
                                </span>
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {t("Chronological financial performance, net savings, and monthly progression.", "تسلسل زمني للأداء المالي والصافي والادخار لكل الشهور.")}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg overflow-x-auto">
                            {availableTimelineYears.map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => setSelectedTimelineYear(year)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedTimelineYear === year
                                        ? 'bg-[#BC5C29] text-white'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                >
                                    {year === 'All' ? t('All Years', 'كل السنوات') : year}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setTimelineViewMode('carousel')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${timelineViewMode === 'carousel' ? 'bg-zinc-800 dark:bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t("Carousel", "سلايدر")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimelineViewMode('grid')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${timelineViewMode === 'grid' ? 'bg-zinc-800 dark:bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                <Grid className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t("Grid", "شبكة")}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: t("Total Revenues", "إجمالي الإيرادات"), value: `+${timelineLedgerStats.totalRev.toLocaleString()}`, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: t("Total Expenses", "إجمالي المصروفات"), value: `-${timelineLedgerStats.totalExp.toLocaleString()}`, color: 'text-rose-600 dark:text-rose-400' },
                        { label: t("Net Savings", "صافي الادخار العام"), value: `${timelineLedgerStats.totalNet >= 0 ? '+' : ''}${timelineLedgerStats.totalNet.toLocaleString()}`, color: timelineLedgerStats.totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400' },
                        { label: t("Profitable Months", "شهور حققت فائضاً"), value: `${timelineLedgerStats.profitable} / ${timelineLedgerStats.count}`, color: 'text-[#BC5C29]' },
                    ].map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/40">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 block mb-0.5">{item.label}</span>
                            <span className={`text-sm sm:text-base font-black ${item.color} font-mono`}>
                                {item.value} <span className="text-[10px] font-normal">EGP</span>
                            </span>
                        </div>
                    ))}
                </div>

                {timelineViewMode === 'carousel' ? (
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => scrollTimeline('left')}
                            className="hidden sm:flex absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTimeline('right')}
                            className="hidden sm:flex absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                        </button>

                        <div
                            ref={timelineScrollRef}
                            className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x no-scrollbar"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {filteredTimelineMonths.map((m) => {
                                const isPos = (m.balance || 0) >= 0;
                                const pct = m.percentage || 0;
                                return (
                                    <div
                                        key={m.id}
                                        className="snap-start shrink-0 w-[260px] sm:w-[275px] p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 hover:border-[#BC5C29]/40 transition-all shadow-sm flex flex-col justify-between space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${isPos ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse shrink-0`} />
                                                    <h4 className="text-sm font-black text-zinc-900 dark:text-white capitalize">{m.month}</h4>
                                                    <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                                                        {m.year}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">ID #{m.id}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg font-mono shrink-0 ${isPos ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                                {pct > 0 ? `+${pct}%` : `${pct}%`}
                                            </span>
                                        </div>

                                        <div className="space-y-1 font-mono text-xs border-t border-b border-zinc-200 dark:border-zinc-700/50 py-2">
                                            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                                                <span>{t("Revenues", "إيرادات")}:</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{(m.revenue || 0).toLocaleString()} EGP</span>
                                            </div>
                                            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                                                <span>{t("Expenses", "مصروفات")}:</span>
                                                <span className="font-bold text-rose-600 dark:text-rose-400">-{(m.expenses || 0).toLocaleString()} EGP</span>
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700/40 font-bold">
                                                <span className="text-zinc-600 dark:text-zinc-300">{t("Net Savings", "الصافي")}:</span>
                                                <span className={isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                    {isPos ? '+' : ''}{(m.balance || 0).toLocaleString()} EGP
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                                            <div className="text-zinc-500 dark:text-zinc-400">
                                                <span>{t("Balance", "الرصيد")}: </span>
                                                <span className="font-bold text-zinc-800 dark:text-zinc-300">{(m.closing_balance || 0).toLocaleString()} EGP</span>
                                            </div>
                                            <Link href="/Timeline" className="font-bold text-[#BC5C29] hover:underline flex items-center gap-1">
                                                <span>{t("Details", "تفاصيل")}</span>
                                                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                        {filteredTimelineMonths.map((m) => {
                            const isPos = (m.balance || 0) >= 0;
                            const pct = m.percentage || 0;
                            return (
                                <div
                                    key={m.id}
                                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 hover:border-[#BC5C29]/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${isPos ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse shrink-0`} />
                                                <h4 className="text-sm font-black text-zinc-900 dark:text-white capitalize">{m.month}</h4>
                                                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/60 px-1.5 py-0.5 rounded">
                                                    {m.year}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">ID #{m.id}</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg font-mono shrink-0 ${isPos ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 font-mono text-xs border-t border-b border-zinc-200 dark:border-zinc-700/50 py-2.5">
                                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                                            <span>{t("Revenues", "إيرادات")}:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">+{(m.revenue || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                                            <span>{t("Expenses", "مصروفات")}:</span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400">-{(m.expenses || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-700/40 font-bold">
                                            <span className="text-zinc-600 dark:text-zinc-300">{t("Net Savings", "الصافي")}:</span>
                                            <span className={isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                {isPos ? '+' : ''}{(m.balance || 0).toLocaleString()} EGP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                                        <div className="text-zinc-500 dark:text-zinc-400">
                                            <span>{t("Balance", "الرصيد")}: </span>
                                            <span className="font-bold text-zinc-800 dark:text-zinc-300">{(m.closing_balance || 0).toLocaleString()} EGP</span>
                                        </div>
                                        <Link href="/Timeline" className="font-bold text-[#BC5C29] hover:underline flex items-center gap-1">
                                            <span>{t("Details", "تفاصيل")}</span>
                                            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
