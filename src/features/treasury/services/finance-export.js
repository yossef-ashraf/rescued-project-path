import ExcelJS from 'exceljs';
import { Month, Credit, Debt, InvestmentAndSavings, Price } from '@/shared/models/index.js';
import { apiError } from '@/shared/utils/api-error.js';

function trim(str) {
    return str ? String(str).trim() : '';
}

export async function generateFinanceExcel(req) {
    try {
        const url = new URL(req.url);
        const yearFilter = url.searchParams.get('year');

        const [allMonthsAsc, credits, debts, goldAssets, prices] = await Promise.all([
            Month.findAll({ order: [['id', 'ASC']], raw: true }),
            Credit.findAll({ raw: true }),
            Debt.findAll({ raw: true }),
            InvestmentAndSavings.findAll({ raw: true }),
            Price.findAll({ raw: true })
        ]);

        const creditsByMonth = new Map();
        for (const c of credits) {
            const mid = c.month_id;
            const amt = parseFloat(c.amount) || 0;
            creditsByMonth.set(mid, (creditsByMonth.get(mid) || 0) + amt);
        }

        const debtsByMonth = new Map();
        const liabilitiesByMonth = new Map();
        const investmentsByMonth = new Map();
        const othersByMonth = new Map();

        for (const d of debts) {
            const mid = d.month_id;
            const amt = parseFloat(d.amount) || 0;
            debtsByMonth.set(mid, (debtsByMonth.get(mid) || 0) + amt);

            if (d.type === 1) {
                liabilitiesByMonth.set(mid, (liabilitiesByMonth.get(mid) || 0) + amt);
            } else if (d.type === 2) {
                investmentsByMonth.set(mid, (investmentsByMonth.get(mid) || 0) + amt);
            } else if (d.type === 0) {
                othersByMonth.set(mid, (othersByMonth.get(mid) || 0) + amt);
            }
        }

        let cumulativeBalance = 0;
        const processedMonths = allMonthsAsc.map(month => {
            const mCredits = creditsByMonth.get(month.id) || 0;
            const mDebts = debtsByMonth.get(month.id) || 0;
            const netMonth = mCredits - mDebts;

            const openingBalance = cumulativeBalance;
            cumulativeBalance += netMonth;

            return {
                ...month,
                opening_balance: openingBalance,
                closing_balance: cumulativeBalance,
                revenue: mCredits,
                expenses: mDebts,
                balance: netMonth,
                percentage: mCredits > 0 ? Math.round((netMonth / mCredits) * 100) : 0,
                liabilities: liabilitiesByMonth.get(month.id) || 0,
                investments: investmentsByMonth.get(month.id) || 0,
                others: othersByMonth.get(month.id) || 0
            };
        });

    const workbook = new ExcelJS.Workbook();

    const setCellColors = (cell, bgHex, textHex, bold = false) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgHex }
        };
        cell.font = {
            bold,
            name: 'Segoe UI',
            color: { argb: textHex }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'CCCCCC' } },
            left: { style: 'thin', color: { argb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
            right: { style: 'thin', color: { argb: 'CCCCCC' } }
        };
    };

    const mainSheet = workbook.addWorksheet('الرئيسية', { views: [{ rightToLeft: true }] });

    mainSheet.addRow(['تقرير التحليل المالي المفصل / Financial Analysis Report Detailed']).font = { bold: true, size: 14, name: 'Segoe UI' };
    mainSheet.addRow([]);

    const globalHeaders = ['Credits', 'Debt', 'Cash', 'Investment And Savings Amount', 'Investment And Savings Price', 'Balance Investment', 'Balance Amount'];
    const globalHeadersRow = mainSheet.addRow(globalHeaders);
    globalHeadersRow.height = 25;
    const globalColors = [
        { bg: 'C3E6CB', text: '155724' },
        { bg: 'F5C6CB', text: '721C24' },
        { bg: 'BEE5EB', text: '0C5460' },
        { bg: 'FFEEBA', text: '856404' },
        { bg: 'FFEEBA', text: '856404' },
        { bg: 'B8DAFF', text: '004085' },
        { bg: 'B8DAFF', text: '004085' }
    ];
    globalHeadersRow.eachCell((cell, colNum) => {
        const colColors = globalColors[colNum - 1];
        setCellColors(cell, colColors.bg, colColors.text, true);
    });

    const totalCreditsAllTime = credits.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const totalDebtsAllTime = debts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const cashAllTime = totalCreditsAllTime - totalDebtsAllTime;
    const totalInvAmount = goldAssets.reduce((sum, g) => sum + parseFloat(g.amount), 0);
    const totalInvPrice = goldAssets.reduce((sum, g) => sum + parseFloat(g.price), 0);
    const balInv = totalInvAmount - totalInvPrice;
    const balAmt = totalInvAmount + cashAllTime;

    const globalValues = [Math.round(totalCreditsAllTime), Math.round(totalDebtsAllTime), Math.round(cashAllTime), Math.round(totalInvAmount), Math.round(totalInvPrice), Math.round(balInv), Math.round(balAmt)];
    const globalValuesRow = mainSheet.addRow(globalValues);
    globalValuesRow.height = 22;
    globalValuesRow.eachCell((cell, colNum) => {
        const colColors = globalColors[colNum - 1];
        setCellColors(cell, 'FFFFFF', colColors.text, true);
    });

    mainSheet.addRow([]);
    mainSheet.addRow([]);

    const monthsByYear = {};
    processedMonths.forEach(m => {
        if (!monthsByYear[m.year]) monthsByYear[m.year] = [];
        monthsByYear[m.year].push(m);
    });

    for (const [year, yearMonths] of Object.entries(monthsByYear)) {
        mainSheet.addRow([`إجمالي التقرير المالي لسنة / Total Report ${year}`]).font = { bold: true, size: 12, name: 'Segoe UI' };
        mainSheet.addRow([]);

        const yrHeaders = ['السنة / Year', 'إجمالي الإيرادات الشهرية / Revenues', 'إجمالي الديون الشهرية / Liabilities', 'إجمالي الاستثمارات الشهرية / Investments', 'مصروفات أخرى / Other Expenses', 'صافي الرصيد السنوي / Balance', 'نسبة الفائض السنوي / Percentage'];
        const yrHeadersRow = mainSheet.addRow(yrHeaders);
        yrHeadersRow.height = 24;
        const yrColors = ['6C757D', 'C3E6CB', 'F5C6CB', 'FFEEBA', 'F8D7DA', 'BEE5EB', 'BEE5EB'];
        const yrTextColors = ['FFFFFF', '155724', '721C24', '856404', '721C24', '0C5460', '0C5460'];
        yrHeadersRow.eachCell((cell, colNum) => {
            setCellColors(cell, yrColors[colNum - 1], yrTextColors[colNum - 1], true);
        });

        const yearRevenue = yearMonths.reduce((sum, m) => sum + m.revenue, 0);
        const yearLiability = yearMonths.reduce((sum, m) => sum + m.liabilities, 0);
        const yearInvestment = yearMonths.reduce((sum, m) => sum + m.investments, 0);
        const yearOther = yearMonths.reduce((sum, m) => sum + m.others, 0);
        const yearBalance = yearRevenue - (yearLiability + yearInvestment + yearOther);
        const yearPercentage = yearRevenue > 0 ? Math.round((yearBalance / yearRevenue) * 100) : 0;

        const yrValues = [year, Math.round(yearRevenue), Math.round(yearLiability), Math.round(yearInvestment), Math.round(yearOther), Math.round(yearBalance), `${yearPercentage}%`];
        const yrValuesRow = mainSheet.addRow(yrValues);
        yrValuesRow.height = 22;
        yrValuesRow.eachCell((cell, colNum) => {
            setCellColors(cell, 'FFFFFF', yrTextColors[colNum - 1] === 'FFFFFF' ? '000000' : yrTextColors[colNum - 1], true);
        });

        mainSheet.addRow([]);

        mainSheet.addRow([`تفاصيل الأشهر لسنة / Monthly Details for ${year}`]).font = { bold: true, size: 11, name: 'Segoe UI' };
        const moHeaders = ['السنة والشهر', 'الرصيد الافتتاحي', 'المكاسب', 'المصروفات', 'الصافي', 'الرصيد الختامي', 'تفاصيل المصروفات'];
        const moHeadersRow = mainSheet.addRow(moHeaders);
        moHeadersRow.height = 24;
        const moColors = ['6C757D', 'E2E3E5', 'C3E6CB', 'F5C6CB', 'BEE5EB', 'E2E3E5', 'E2E3E5'];
        const moTextColors = ['FFFFFF', '383D41', '155724', '721C24', '0C5460', '383D41', '383D41'];
        moHeadersRow.eachCell((cell, colNum) => {
            setCellColors(cell, moColors[colNum - 1], moTextColors[colNum - 1], true);
        });

        const sortedYearMonths = [...yearMonths].reverse();
        sortedYearMonths.forEach(m => {
            const expDetailsStr = `L: ${Math.round(m.liabilities)} | I: ${Math.round(m.investments)} | O: ${Math.round(m.others)}`;
            const rowValues = [`${m.month} ${m.year}`, Math.round(m.opening_balance), Math.round(m.revenue), Math.round(m.expenses), `${Math.round(m.balance)} (${m.percentage}%)`, Math.round(m.closing_balance), expDetailsStr];

            const row = mainSheet.addRow(rowValues);
            row.height = 20;

            const rowBg = m.balance >= 0 ? 'D4EDDA' : 'F8D7DA';
            const rowText = m.balance >= 0 ? '155724' : '721C24';
            row.eachCell((cell, colNum) => {
                setCellColors(cell, rowBg, rowText, false);
            });
        });

        mainSheet.addRow([]);
        mainSheet.addRow([]);
    }

    mainSheet.addRow(['حقيبة الاستثمار والمدخرات / Investment & Savings Portfolio']).font = { bold: true, size: 12, name: 'Segoe UI' };
    mainSheet.addRow([]);
    const invHeaders = ['Type', 'Price', 'Current Amount', 'Profit/Loss', 'Note', 'Date'];
    const invHeadersRow = mainSheet.addRow(invHeaders);
    invHeadersRow.height = 24;
    invHeadersRow.eachCell(cell => {
        setCellColors(cell, 'FFEEBA', '856404', true);
    });

    const priceMap = {};
    (prices || []).forEach(p => {
        if (p.name) priceMap[p.name.trim()] = parseFloat(p.price) || 0;
    });

    goldAssets.forEach(inv => {
        const isCash = (inv.name || '').toLowerCase() === 'cash';
        const grams = parseFloat(inv.val) || (!isCash && parseFloat(inv.amount) <= 100 ? parseFloat(inv.amount) : 0);
        const pricePerGram = priceMap[inv.name] || 0;

        let currentAmount = 0;
        if (isCash) {
            currentAmount = parseFloat(inv.amount || inv.price || 0);
        } else if (grams > 0 && pricePerGram > 0) {
            currentAmount = grams * pricePerGram;
        } else {
            currentAmount = parseFloat(inv.amount) || 0;
        }

        const purchasePrice = parseFloat(inv.price) || 0;
        const profit = currentAmount - purchasePrice;
        const dateStr = inv.gregorian_date ? new Date(inv.gregorian_date).toISOString().slice(0, 10) : '-';

        const rowValues = [inv.name, Math.round(purchasePrice), Math.round(currentAmount), Math.round(profit), inv.note || '', dateStr];

        const row = mainSheet.addRow(rowValues);
        row.height = 20;
        row.eachCell((cell, colNum) => {
            const cellColor = colNum === 4 ? (profit >= 0 ? '155724' : '721C24') : '856404';
            setCellColors(cell, 'FFFFF0', cellColor, colNum === 4);
        });
    });

    mainSheet.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell(cell => {
            const val = cell.value ? String(cell.value) : '';
            if (val.length > maxLen) maxLen = val.length;
        });
        column.width = Math.max(maxLen + 4, 15);
    });

    const yearsList = [...new Set(allMonthsAsc.map(m => m.year))].sort((a, b) => a - b);

    for (const targetYear of yearsList) {
        const yrSheet = workbook.addWorksheet(String(targetYear), { views: [{ rightToLeft: true }] });

        const yrMonths = allMonthsAsc.filter(m => m.year === targetYear);
        const monthMap = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12,
            '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12
        };
        yrMonths.sort((a, b) => (monthMap[a.month] || 1) - (monthMap[b.month] || 1));

        yrMonths.forEach(m => {
            const mHeaderRow = yrSheet.addRow([`شهر: ${m.month}`]);
            yrSheet.mergeCells(mHeaderRow.number, 1, mHeaderRow.number, 6);
            mHeaderRow.height = 26;
            const mHeaderCell = mHeaderRow.getCell(1);
            setCellColors(mHeaderCell, 'D9EDF7', '31708F', true);
            mHeaderCell.font.size = 14;

            const subHeadersRow = yrSheet.addRow([]);
            yrSheet.mergeCells(subHeadersRow.number, 1, subHeadersRow.number, 3);
            yrSheet.mergeCells(subHeadersRow.number, 4, subHeadersRow.number, 6);
            subHeadersRow.height = 24;

            const cCell = subHeadersRow.getCell(1);
            cCell.value = 'المكاسب (Credits)';
            setCellColors(cCell, 'DFF0D8', '3C763D', true);

            const dCell = subHeadersRow.getCell(4);
            dCell.value = 'المصروفات (Debts)';
            setCellColors(dCell, 'F2DEDE', 'A94442', true);

            const titlesRow = yrSheet.addRow(['اسم البند', 'المبلغ', 'ملاحظات', 'اسم البند', 'المبلغ', 'ملاحظات']);
            titlesRow.height = 22;
            titlesRow.eachCell(cell => {
                setCellColors(cell, 'F2F2F2', '333333', true);
            });

            const mCredits = credits.filter(c => c.month_id === m.id);
            const mDebts = debts.filter(d => d.month_id === m.id);
            const maxRows = Math.max(mCredits.length, mDebts.length);

            for (let i = 0; i < maxRows; i++) {
                const rowVals = [
                    mCredits[i] ? mCredits[i].name : '',
                    mCredits[i] ? parseFloat(mCredits[i].amount) : '',
                    mCredits[i] ? (mCredits[i].note || '') : '',
                    mDebts[i] ? mDebts[i].name : '',
                    mDebts[i] ? parseFloat(mDebts[i].amount) : '',
                    mDebts[i] ? (mDebts[i].note || '') : ''
                ];
                const r = yrSheet.addRow(rowVals);
                r.height = 20;
                r.eachCell((cell, colNum) => {
                    setCellColors(cell, 'FFFFFF', '333333', false);
                });
            }

            const totalsRow = yrSheet.addRow([
                'الإجمالي',
                mCredits.reduce((sum, c) => sum + parseFloat(c.amount), 0),
                '',
                'الإجمالي',
                mDebts.reduce((sum, d) => sum + parseFloat(d.amount), 0),
                ''
            ]);
            totalsRow.height = 22;
            totalsRow.eachCell(cell => {
                setCellColors(cell, 'F2F2F2', '000000', true);
            });

            const spacer = yrSheet.addRow([]);
            spacer.height = 20;
        });

        yrSheet.columns.forEach(column => {
            column.width = 18;
        });
    }

    const statsSheet = workbook.addWorksheet('إحصائيات المبالغ', { views: [{ rightToLeft: true }] });

    const creditGroups = {};
    credits.forEach(c => {
        const name = trim(c.name);
        if (!name) return;
        creditGroups[name] = (creditGroups[name] || 0) + parseFloat(c.amount);
    });

    const debtGroups = {};
    debts.forEach(d => {
        const name = trim(d.name);
        if (!name) return;
        debtGroups[name] = (debtGroups[name] || 0) + parseFloat(d.amount);
    });

    const allNames = [...new Set([...Object.keys(creditGroups), ...Object.keys(debtGroups)])];
    const statsData = allNames.map(name => ({
        name,
        total_credit: creditGroups[name] || 0,
        total_debt: debtGroups[name] || 0
    }));

    statsData.sort((a, b) => {
        const hasNumA = /\d+/.test(a.name) ? 1 : 0;
        const hasNumB = /\d+/.test(b.name) ? 1 : 0;
        if (hasNumA !== hasNumB) return hasNumA - hasNumB;

        if (hasNumA) {
            const matchA = a.name.match(/\d+/);
            const matchB = b.name.match(/\d+/);
            const numA = matchA ? parseInt(matchA[0]) : 0;
            const numB = matchB ? parseInt(matchB[0]) : 0;
            return numB - numA;
        }
        return a.name.localeCompare(b.name);
    });

    const statsHeader = statsSheet.addRow(['اسم البند', 'إجمالي المكاسب', 'إجمالي المصروفات']);
    statsHeader.height = 24;
    statsHeader.eachCell(cell => {
        setCellColors(cell, '6C757D', 'FFFFFF', true);
    });

    statsData.forEach(item => {
        const r = statsSheet.addRow([item.name, item.total_credit, item.total_debt]);
        r.height = 20;
        r.eachCell((cell, colNum) => {
            setCellColors(cell, 'FFFFFF', colNum === 2 ? '155724' : (colNum === 3 ? '721C24' : '333333'), colNum > 1);
        });
    });

    statsSheet.columns.forEach(column => {
        column.width = 22;
    });

    const goldSheet = workbook.addWorksheet('إستثمارات الذهب', { views: [{ rightToLeft: true }] });

    const goldItems = goldAssets.filter(g => g.name.toLowerCase().includes('gold') || g.name.includes('ذهب'));
    const latestPrice21 = prices.find(p => p.name === 'Gold 21')?.price || 0;

    let sum18 = 0;
    let sum21 = 0;
    let sum24 = 0;
    let sumEquiv21 = 0;
    let sumCost = 0;
    let sumCurrentVal = 0;

    const goldDetails = goldItems.map(g => {
        let karat = 21;
        if (/18/.test(g.name)) karat = 18;
        else if (/24/.test(g.name)) karat = 24;
        else if (/21/.test(g.name)) karat = 21;

        const grams = parseFloat(g.val || 0);
        const equiv21 = grams * (karat / 21);
        const cost = parseFloat(g.price || 0);
        const buyUnitPrice = grams > 0 ? cost / grams : 0;
        const itemCurrentPrice = parseFloat(prices.find(p => p.name === g.name)?.price || 0);
        const currentVal = grams * itemCurrentPrice;
        const profit = currentVal - cost;

        if (karat === 18) sum18 += grams;
        else if (karat === 21) sum21 += grams;
        else if (karat === 24) sum24 += grams;

        sumEquiv21 += equiv21;
        sumCost += cost;
        sumCurrentVal += currentVal;

        return [
            g.name,
            g.gregorian_date ? new Date(g.gregorian_date).toISOString().slice(0, 10) : '',
            g.hijri_date || '',
            grams,
            equiv21,
            cost,
            buyUnitPrice,
            currentVal,
            profit
        ];
    });

    const goldSumHeaderRow = goldSheet.addRow(['إجمالي وزن 18', 'إجمالي وزن 21', 'إجمالي وزن 24', 'يعادل وزن 21 الكلي', 'إجمالي التكلفة المدفوعة', 'القيمة الحالية الإجمالية', 'صافي الربح / الخسارة', 'سعر جرام 21 مسجل حالياً']);
    goldSumHeaderRow.height = 26;
    goldSumHeaderRow.eachCell(cell => {
        setCellColors(cell, '215967', 'FFFFFF', true);
    });

    const goldSumDataRow = goldSheet.addRow([
        `${Math.round(sum18)} جرام`,
        `${Math.round(sum21)} جرام`,
        `${Math.round(sum24)} جرام`,
        `${Math.round(sumEquiv21)} جرام`,
        `${Math.round(sumCost).toLocaleString()} ج.م`,
        `${Math.round(sumCurrentVal).toLocaleString()} ج.م`,
        `${Math.round(sumCurrentVal - sumCost).toLocaleString()} ج.م`,
        `${Math.round(latestPrice21).toLocaleString()} ج.م`
    ]);
    goldSumDataRow.height = 24;
    goldSumDataRow.eachCell(cell => {
        setCellColors(cell, 'E0F7FA', '1A525F', true);
    });

    goldSheet.addRow([]);

    const goldDetHeaderRow = goldSheet.addRow(['اسم البند (العيار)', 'تاريخ الشراء (ميلادي)', 'تاريخ الشراء (هجري)', 'الوزن (جرام)', 'يعادل 21 (جرام)', 'التكلفة (ج.م)', 'سعر الشراء للجرام (ج.م)', 'القيمة الحالية (ج.م)', 'المكسب / الخسارة (ج.م)', 'سعر البيع للجرام (ج.م)']);
    goldDetHeaderRow.height = 24;
    goldDetHeaderRow.eachCell(cell => {
        setCellColors(cell, 'FFF2CC', '856404', true);
    });

    goldDetails.forEach(detail => {
        const grams = detail[3];
        const currentVal = detail[7];
        const sellPriceGrams = grams > 0 ? currentVal / grams : 0;
        const profit = detail[8];

        const row = goldSheet.addRow([
            detail[0],
            detail[1],
            detail[2],
            Math.round(grams),
            Math.round(detail[4]),
            Math.round(detail[5]).toLocaleString(),
            Math.round(detail[6]).toLocaleString(),
            Math.round(currentVal).toLocaleString(),
            Math.round(profit).toLocaleString(),
            Math.round(sellPriceGrams).toLocaleString()
        ]);
        row.height = 20;

        row.eachCell((cell, colNum) => {
            const isProfitCol = colNum === 9;
            const cellText = isProfitCol ? (profit >= 0 ? '155724' : '721C24') : '333333';
            setCellColors(cell, 'FFFFF0', cellText, isProfitCol);
        });
    });

    goldSheet.columns.forEach(column => {
        column.width = 18;
    });

        const buffer = await workbook.xlsx.writeBuffer();
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="financial_report_${yearFilter || 'full'}.xlsx"`
            }
        });
    } catch (err) {
        return apiError(err);
    }
}
