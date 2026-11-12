export function buildMainSheetRows(processedMonths = [], credits = [], debts = [], goldAssets = [], prices = []) {
  const rows = [];
  rows.push(['تقرير التحليل المالي المفصل / Financial Analysis Report Detailed', '', '', '', '', '', '']);

  const priceMap = {};
  (prices || []).forEach(p => {
    if (p.name) priceMap[p.name.trim()] = parseFloat(p.price) || 0;
  });

  const getItemCurrentAmount = (inv) => {
    const isCash = (inv.name || '').toLowerCase() === 'cash';
    const grams = parseFloat(inv.val) || (!isCash && parseFloat(inv.amount) <= 100 ? parseFloat(inv.amount) : 0);
    const pricePerGram = priceMap[inv.name] || 0;

    if (isCash) {
      return parseFloat(inv.amount || inv.price || 0);
    }
    if (grams > 0 && pricePerGram > 0) {
      return grams * pricePerGram;
    }
    return parseFloat(inv.amount) || 0;
  };

  const totalCreditsAllTime = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const totalDebtsAllTime = debts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const cashAllTime = totalCreditsAllTime - totalDebtsAllTime;
  const totalInvAmount = goldAssets.reduce((sum, g) => sum + getItemCurrentAmount(g), 0);
  const totalInvPrice = goldAssets.reduce((sum, g) => sum + (parseFloat(g.price) || 0), 0);
  const balInv = totalInvAmount - totalInvPrice;
  const balAmt = totalInvAmount + cashAllTime;

  rows.push(['Credits (الإيرادات)', 'Total Outflows (التدفقات)', 'Cash (الرصيد النقدي)', 'Investment Val (قيمة الاستثمار)', 'Investment Cost (تكلفة الشراء)', 'Unrealized P&L (أرباح الاستثمار)', 'Net Worth (صافي المحفظة)']);
  rows.push([
    Math.round(totalCreditsAllTime).toLocaleString(),
    Math.round(totalDebtsAllTime).toLocaleString(),
    Math.round(cashAllTime).toLocaleString(),
    Math.round(totalInvAmount).toLocaleString(),
    Math.round(totalInvPrice).toLocaleString(),
    Math.round(balInv).toLocaleString(),
    Math.round(balAmt).toLocaleString()
  ]);

  rows.push(['', '', '', '', '', '', '']);

  const monthsByYear = {};
  processedMonths.forEach(m => {
    const yr = String(m.year || '2026');
    if (!monthsByYear[yr]) monthsByYear[yr] = [];
    monthsByYear[yr].push(m);
  });

  const sortedYears = Object.keys(monthsByYear).sort((a, b) => parseInt(b) - parseInt(a));

  sortedYears.forEach(year => {
    const yearMonths = monthsByYear[year] || [];

    rows.push([`إجمالي التقرير المالي لسنة / Total Report ${year}`, '', '', '', '', '', '']);
    rows.push(['السنة / Year', 'إجمالي الإيرادات / Revenues', 'إجمالي الديون / Debt Liabilities', 'إجمالي الاستثمارات / Investments', 'مصروفات أخرى / Other Expenses', 'صافي التدفق النقدي / Net Cash Flow', 'نسبة الفائض / Margin %']);

    const yearRevenue = yearMonths.reduce((sum, m) => sum + m.revenue, 0);
    const yearLiability = yearMonths.reduce((sum, m) => sum + m.liabilities, 0);
    const yearInvestment = yearMonths.reduce((sum, m) => sum + m.investments, 0);
    const yearOther = yearMonths.reduce((sum, m) => sum + m.others, 0);
    const yearBalance = yearRevenue - (yearLiability + yearInvestment + yearOther);
    const yearPercentage = yearRevenue > 0 ? Math.round((yearBalance / yearRevenue) * 100) : 0;

    rows.push([
      year,
      Math.round(yearRevenue).toLocaleString(),
      Math.round(yearLiability).toLocaleString(),
      Math.round(yearInvestment).toLocaleString(),
      Math.round(yearOther).toLocaleString(),
      Math.round(yearBalance).toLocaleString(),
      `${yearPercentage}%`
    ]);

    rows.push([`تفاصيل الأشهر لسنة / Monthly Details for ${year}`, '', '', '', '', '', '']);
    rows.push(['السنة والشهر', 'الرصيد الافتتاحي', 'المكاسب', 'المصروفات', 'الصافي', 'الرصيد الختامي', 'تفاصيل المصروفات']);

    const sortedYearMonths = [...yearMonths].reverse();
    sortedYearMonths.forEach(m => {
      const expDetailsStr = `L: ${Math.round(m.liabilities)} | I: ${Math.round(m.investments)} | O: ${Math.round(m.others)}`;
      rows.push([
        `${m.month} ${m.year}`,
        Math.round(m.opening_balance).toLocaleString(),
        Math.round(m.revenue).toLocaleString(),
        Math.round(m.expenses).toLocaleString(),
        `${Math.round(m.balance).toLocaleString()} (${m.percentage}%)`,
        Math.round(m.closing_balance).toLocaleString(),
        expDetailsStr
      ]);
    });

    rows.push(['* معادلة الحساب: صافي التدفق النقدي = الإيرادات - (الديون + الاستثمارات + المصروفات الأخرى)', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', '', '']);
  });

  rows.push(['حقيبة الاستثمار والمدخرات / Investment & Savings Portfolio', '', '', '', '', '', '']);
  rows.push(['Type', 'Price', 'Current Amount', 'Profit/Loss', 'Note', 'Date', '']);

  goldAssets.forEach(inv => {
    const purchasePrice = parseFloat(inv.price || 0);
    const currentAmount = parseFloat(inv.amount || 0);
    const profit = currentAmount - purchasePrice;
    const dateStr = inv.gregorian_date ? String(inv.gregorian_date).slice(0, 10) : '-';
    rows.push([
      inv.name || 'Gold Asset',
      Math.round(purchasePrice).toLocaleString(),
      Math.round(currentAmount).toLocaleString(),
      Math.round(profit).toLocaleString(),
      inv.note || '',
      dateStr,
      ''
    ]);
  });

  return rows;
}

export function buildYearlySheetRows(processedMonths = [], credits = [], debts = [], targetYear) {
  const rows = [];
  const yrMonths = processedMonths.filter(m => String(m.year) === String(targetYear));
  const reversedMonths = [...yrMonths].reverse();

  reversedMonths.forEach(m => {
    rows.push([`شهر: ${m.month}`, '', '', '', '', '']);
    rows.push(['المكاسب (Credits)', '', '', 'المصروفات (Debts)', '', '']);
    rows.push(['اسم البند', 'المبلغ', 'ملاحظات', 'اسم البند', 'المبلغ', 'ملاحظات']);

    const mCredits = credits.filter(c => String(c.month_id) === String(m.id));
    const mDebts = debts.filter(d => String(d.month_id) === String(m.id));
    const maxR = Math.max(mCredits.length, mDebts.length, 1);

    for (let i = 0; i < maxR; i++) {
      rows.push([
        mCredits[i] ? mCredits[i].name : '',
        mCredits[i] ? parseFloat(mCredits[i].amount).toLocaleString() : '',
        mCredits[i] ? (mCredits[i].note || '') : '',
        mDebts[i] ? mDebts[i].name : '',
        mDebts[i] ? parseFloat(mDebts[i].amount).toLocaleString() : '',
        mDebts[i] ? (mDebts[i].note || '') : ''
      ]);
    }

    const totalC = mCredits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalD = mDebts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    rows.push(['الإجمالي', totalC.toLocaleString(), '', 'الإجمالي', totalD.toLocaleString(), '']);
    rows.push(['', '', '', '', '', '']);
  });

  return rows;
}

export function buildGoldSheetRows(goldAssets = []) {
  return [
    ['Type', 'Price', 'Current Amount', 'Profit/Loss', 'Note', 'Date'],
    ...goldAssets.map(g => {
      const val = parseFloat(g.amount || 0);
      const price = parseFloat(g.price || 0);
      return [
        g.name || 'Gold Asset',
        price.toLocaleString(),
        val.toLocaleString(),
        (val - price).toLocaleString(),
        g.note || '',
        g.gregorian_date ? String(g.gregorian_date).slice(0, 10) : '-'
      ];
    })
  ];
}

export function buildStatsSheetRows(credits = [], debts = []) {
  const creditGroups = {};
  credits.forEach(c => {
    const name = (c.name || '').trim();
    if (!name) return;
    creditGroups[name] = (creditGroups[name] || 0) + (parseFloat(c.amount) || 0);
  });

  const debtGroups = {};
  debts.forEach(d => {
    const name = (d.name || '').trim();
    if (!name) return;
    debtGroups[name] = (debtGroups[name] || 0) + (parseFloat(d.amount) || 0);
  });

  const allNames = [...new Set([...Object.keys(creditGroups), ...Object.keys(debtGroups)])];

  return [
    ['اسم البند', 'إجمالي المكاسب', 'إجمالي المصروفات'],
    ...allNames.map(name => [
      name,
      (creditGroups[name] || 0).toLocaleString(),
      (debtGroups[name] || 0).toLocaleString()
    ])
  ];
}

export function getCurrentSheetRows(activeSheet, processedMonths, credits, debts, goldAssets, prices) {
  if (activeSheet === 'الرئيسية') {
    return buildMainSheetRows(processedMonths, credits, debts, goldAssets, prices);
  }

  if (/^\d{4}$/.test(activeSheet) || processedMonths.some(m => String(m.year) === activeSheet)) {
    return buildYearlySheetRows(processedMonths, credits, debts, activeSheet);
  }

  if (activeSheet === 'إستثمارات الذهب') {
    return buildGoldSheetRows(goldAssets);
  }

  if (activeSheet === 'إحصائيات المبالغ') {
    return buildStatsSheetRows(credits, debts);
  }

  return [];
}

export function processMonthsData(months = [], credits = [], debts = []) {
  if (!months || months.length === 0) return [];

  const sorted = [...months].sort((a, b) => parseInt(a.id) - parseInt(b.id));
  let cumulativeBalance = 0;

  return sorted.map(m => {
    const mCredits = credits
      .filter(c => String(c.month_id) === String(m.id))
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    const mDebts = debts
      .filter(d => String(d.month_id) === String(m.id))
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const netMonth = mCredits - mDebts;
    const openingBalance = cumulativeBalance;
    cumulativeBalance += netMonth;

    const liabilities = debts
      .filter(d => String(d.month_id) === String(m.id) && Number(d.type) === 1)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const investments = debts
      .filter(d => String(d.month_id) === String(m.id) && Number(d.type) === 2)
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    const others = debts
      .filter(d => String(d.month_id) === String(m.id) && (Number(d.type) === 0 || ![1, 2].includes(Number(d.type))))
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    return {
      ...m,
      opening_balance: openingBalance,
      closing_balance: cumulativeBalance,
      revenue: mCredits,
      expenses: mDebts,
      balance: netMonth,
      percentage: mCredits > 0 ? Math.round((netMonth / mCredits) * 100) : 0,
      liabilities,
      investments,
      others
    };
  });
}
