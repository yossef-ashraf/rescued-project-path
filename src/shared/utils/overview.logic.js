export function filterCashFlowData(chartData, timeRange) {
    if (!chartData || chartData.length === 0) return [];
    let sliceCount = chartData.length;
    if (timeRange === '6') sliceCount = 6;
    if (timeRange === '12') sliceCount = 12;
    return chartData.slice(-sliceCount).map(item => {
        const rev = Number(item.credits || 0);
        const debts = Number(item.debts || 0);
        const investments = Number(item.investments || 0);
        const others = Number(item.others || 0);
        const totalExp = debts + investments + others;
        const net = rev - totalExp;
        return {
            name: item.name || '',
            credits: rev,
            debts: debts,
            investments: investments,
            others: others,
            revenue: rev,
            totalExpenses: totalExp,
            expenses: totalExp,
            net: net
        };
    });
}

export function calculateTopExpenses(expenseDistribution, othersDistribution) {
    const list = expenseDistribution?.length > 0 ? expenseDistribution : (othersDistribution || []);
    return [...list]
        .sort((a, b) => (b.total || b.amount || 0) - (a.total || a.amount || 0))
        .slice(0, 5)
        .map(item => ({
            name: item.name || item.category || 'Category',
            amount: Math.round(item.total || item.amount || 0)
        }));
}

export function calculateTopDebts(liabilityDistribution, stats, fallbackName) {
    const list = liabilityDistribution?.length > 0 ? liabilityDistribution : [];
    if (list.length === 0) {
        return [
            { name: fallbackName, amount: Math.round(stats.totalDebtAmountCY || stats.totalDebtAmount || 0) }
        ];
    }
    return [...list]
        .filter(item => (item.amount || item.total || 0) > 0)
        .sort((a, b) => (b.amount || b.total || 0) - (a.amount || a.total || 0))
        .slice(0, 5)
        .map(item => ({
            name: item.category || item.name || 'Debt',
            amount: Math.round(item.amount || item.total || 0)
        }));
}

export function getAvailableTimelineYears(monthsList) {
    const years = Array.from(new Set(monthsList.map(m => String(m.year || '')))).filter(Boolean);
    years.sort((a, b) => b.localeCompare(a));
    return ['All', ...years];
}

export function filterTimelineMonths(monthsList, selectedTimelineYear) {
    if (selectedTimelineYear === 'All') return monthsList;
    return monthsList.filter(m => String(m.year) === selectedTimelineYear);
}

export function calculateTimelineLedgerStats(filteredTimelineMonths) {
    const count = filteredTimelineMonths.length;
    const totalRev = filteredTimelineMonths.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0);
    const totalExp = filteredTimelineMonths.reduce((sum, m) => sum + (parseFloat(m.expenses) || 0), 0);
    const totalNet = totalRev - totalExp;
    const profitable = filteredTimelineMonths.filter(m => (m.balance || 0) >= 0).length;
    return { count, totalRev, totalExp, totalNet, profitable };
}

export function getActiveMonths(chartData) {
    if (chartData && chartData.length > 0) {
        return chartData.slice(-12);
    }
    return [
        { credits: 25000, debts: 12000, investments: 8000, others: 5000, balance: 8000 },
        { credits: 32000, debts: 15000, investments: 12000, others: 6000, balance: 11000 },
        { credits: 28000, debts: 14000, investments: 10000, others: 7000, balance: 7000 },
        { credits: 45000, debts: 18000, investments: 20000, others: 8000, balance: 19000 },
        { credits: 38000, debts: 16000, investments: 15000, others: 7500, balance: 14500 },
        { credits: 52000, debts: 21000, investments: 25000, others: 9000, balance: 22000 }
    ];
}

export function generateSparklineRevenue(activeMonths) {
    return activeMonths.map(d => ({ v: Number(d.credits) || 10 }));
}

export function generateSparklineDebts(activeMonths) {
    return activeMonths.map(d => ({ v: Number(d.debts) || 8 }));
}

export function generateSparklineInvestments(activeMonths) {
    return activeMonths.map((d, i) => ({ v: Math.max(5, (Number(d.investments) || 0) + (i * 1200) + 1500) }));
}

export function generateSparklineOthers(activeMonths) {
    return activeMonths.map((d, i) => ({ v: Math.max(5, (Number(d.others) || 0) + ((i % 3) * 800) + 1000) }));
}

export function generateSparklineBalance(activeMonths) {
    return activeMonths.map(d => ({ v: Number(d.balance) || 5 }));
}

export function generateSparklineGoldWeight(activeMonths) {
    return activeMonths.map((_, i) => ({ v: 45 + (i * 3.5) + (Math.sin(i) * 2) }));
}

export function generateSparklineGoldCost(activeMonths) {
    return activeMonths.map((_, i) => ({ v: 180000 + (i * 12000) + (Math.cos(i) * 5000) }));
}

export function generateSparklineGoldVal(activeMonths) {
    return activeMonths.map((_, i) => ({ v: 220000 + (i * 28000) + (Math.sin(i) * 8000) }));
}

export function generateSparklineTotalVal(activeMonths) {
    return activeMonths.map((_, i) => ({ v: 250000 + (i * 30000) + (Math.sin(i) * 10000) }));
}

export function generateSparklineProfit(activeMonths) {
    return activeMonths.map((_, i) => ({ v: 30000 + (i * 16000) + (Math.sin(i) * 4000) }));
}
