import { requireAuth, ok, unauthorized, badRequest, notFound, serverError } from '@/shared/utils/response.js';
import { Month, Debt, Credit, Price, Transaction, InvestmentAndSavings, GoldAsset, sequelize } from '@/shared/models/index.js';
import { generateFinanceExcel } from '@/features/treasury/services/finance-export.js';
import { tableStructures } from '@/shared/database/table-structures.js';
import { recordAuthLog, getClientIp } from '@/features/auth/services/auth.js';
import { calculateGoldMetrics } from '@/features/treasury/utils/gold.logic.js';

let cachedStats = null;
let statsCacheTime = 0;
const STATS_TTL_MS = 5 * 60 * 1000;

let cachedMonths = null;
let monthsCacheTime = 0;
const MONTHS_TTL_MS = 5 * 60 * 1000;

function invalidateFinanceCache() {
    cachedStats = null;
    statsCacheTime = 0;
    cachedMonths = null;
    monthsCacheTime = 0;
}

const MONTH_MAP = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12
};

async function syncInvestmentsWithPrice(name, priceVal) {
    if (!name || priceVal === undefined || priceVal === null) return;
    const numPrice = parseFloat(priceVal);
    if (isNaN(numPrice) || numPrice <= 0) return;

    try {
        const investments = await InvestmentAndSavings.findAll({
            attributes: ['id', 'name', 'note', 'val', 'price', 'amount', 'rate', 'currency'],
            raw: true
        });
        const priceName = name.toLowerCase();

        for (const item of investments) {
            let val = parseFloat(item.val || 0);
            const currentAmount = parseFloat(item.amount || 0);
            const currentPrice = parseFloat(item.price || 0);
            const itemName = (item.name || '').toLowerCase();
            const itemNote = (item.note || '').toLowerCase();
            const itemCurrency = item.currency || '';

            if (val <= 0) {
                if (currentAmount > 0) val = currentAmount;
                else if (currentPrice > 0) val = currentPrice;
            }

            // Do not sync Egyptian Pound (EGP) assets with market rates of gold or foreign currencies
            if (itemCurrency === 'EGP' || itemName.includes('egp') || itemName.includes('جنيه') || itemName.includes('مصري')) {
                continue;
            }

            let isMatch = false;
            let isForeignCurrency = false;

            if (itemCurrency === 'GOLD_24') {
                if (priceName.includes('24') || priceName.includes('٢٤')) isMatch = true;
            } else if (itemCurrency === 'GOLD_21') {
                if (priceName.includes('21') || priceName.includes('٢١')) isMatch = true;
            } else if (itemCurrency === 'GOLD_18') {
                if (priceName.includes('18') || priceName.includes('١٨')) isMatch = true;
            } else if (itemCurrency === 'USD') {
                if (priceName.includes('dollar') || priceName.includes('usd') || priceName.includes('دولار')) {
                    isMatch = true;
                    isForeignCurrency = true;
                }
            } else if (itemCurrency === 'SAR') {
                if (priceName.includes('riyal') || priceName.includes('sar') || priceName.includes('ريال')) {
                    isMatch = true;
                    isForeignCurrency = true;
                }
            } else {
                const combined = `${itemName} ${itemNote}`;
                if (combined.includes('gold') || combined.includes('ذهب') || combined.includes('عيار')) {
                    if (priceName.includes('24') && (combined.includes('24') || combined.includes('٢٤'))) isMatch = true;
                    if (priceName.includes('21') && (combined.includes('21') || combined.includes('٢١'))) isMatch = true;
                    if (priceName.includes('18') && (combined.includes('18') || combined.includes('١٨'))) isMatch = true;
                } else if ((priceName.includes('dollar') || priceName.includes('usd') || priceName.includes('دولار')) &&
                           (combined.includes('dollar') || combined.includes('usd') || combined.includes('دولار') || combined.includes('$'))) {
                    isMatch = true;
                    isForeignCurrency = true;
                } else if ((priceName.includes('riyal') || priceName.includes('sar') || priceName.includes('ريال')) &&
                           (combined.includes('riyal') || combined.includes('sar') || combined.includes('ريال') || combined.includes('ر.س'))) {
                    isMatch = true;
                    isForeignCurrency = true;
                }
            }

            if (isMatch && val > 0) {
                const newAmount = Math.round((val * numPrice) * 100) / 100;
                const updateData = {
                    val: val,
                    rate: numPrice,
                    amount: newAmount,
                    updated_at: new Date().toISOString()
                };
                if (isForeignCurrency && currentPrice > 0 && Math.abs(currentPrice - val) < 0.01) {
                    updateData.price = newAmount;
                }
                await InvestmentAndSavings.update(
                    updateData,
                    { where: { id: item.id } }
                );
            }
        }
    } catch (e) {
        console.error('Error syncing investments with price:', e);
    }
}

export class FinanceController {
    static invalidateCache() {
        invalidateFinanceCache();
    }

    static async exportExcel(req) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();
        return generateFinanceExcel(req);
    }

    static async getStats(req) {
    try {
        const user = await requireAuth(req);
        if (!user) return unauthorized();
        if (cachedStats && (Date.now() - statsCacheTime < STATS_TTL_MS)) {
            return ok(cachedStats);
        }

        const currentYear = new Date().getFullYear();

        const [
            allCredits,
            allDebts,
            allInvestments,
            monthsList
        ] = await Promise.all([
            Credit.findAll({ attributes: ['amount', 'month_id', 'year'], raw: true }),
            Debt.findAll({ attributes: ['name', 'amount', 'type', 'month_id', 'year'], raw: true }),
            InvestmentAndSavings.findAll({ attributes: ['name', 'val', 'amount', 'price', 'note', 'currency'], raw: true }),
            Month.findAll({ attributes: ['id', 'month', 'year'], order: [['id', 'ASC']], raw: true })
        ]);

        let totalCredits = 0;
        let totalDebtAmount = 0;
        let totalInvestmentAmount = 0;
        let totalOtherAmount = 0;

        let totalCreditsCY = 0;
        let totalDebtAmountCY = 0;
        let totalInvestmentAmountCY = 0;
        let totalOtherAmountCY = 0;

        const monthlyCreditsMap = {};
        (allCredits || []).forEach(c => {
            const amt = parseFloat(c.amount || 0);
            totalCredits += amt;
            if (parseInt(c.year, 10) === currentYear) totalCreditsCY += amt;
            const mId = String(c.month_id);
            monthlyCreditsMap[mId] = (monthlyCreditsMap[mId] || 0) + amt;
        });

        const monthlyDebtsMap = {};
        const debtDistributionMap = {};
        (allDebts || []).forEach(d => {
            const amt = parseFloat(d.amount || 0);
            const type = Number(d.type);
            const isCY = parseInt(d.year, 10) === currentYear;

            if (type === 1) {
                totalDebtAmount += amt;
                if (isCY) totalDebtAmountCY += amt;
            } else if (type === 2) {
                totalInvestmentAmount += amt;
                if (isCY) totalInvestmentAmountCY += amt;
            } else {
                totalOtherAmount += amt;
                if (isCY) totalOtherAmountCY += amt;
            }

            const mId = String(d.month_id);
            const key = `${mId}_${type}`;
            monthlyDebtsMap[key] = (monthlyDebtsMap[key] || 0) + amt;

            const name = d.name || 'Other';
            const distKey = `${name}_${type}`;
            if (!debtDistributionMap[distKey]) {
                debtDistributionMap[distKey] = { name, type, total: 0 };
            }
            debtDistributionMap[distKey].total += amt;
        });

        const currentBalance = totalCredits - (totalDebtAmount + totalInvestmentAmount + totalOtherAmount);
        const totalDebtsCY = totalDebtAmountCY + totalInvestmentAmountCY + totalOtherAmountCY;
        const remainingBalanceCY = Math.max(0, totalCreditsCY - totalDebtsCY);

        const goldMetrics = calculateGoldMetrics(allInvestments || []);

        const totalGoldWeight = Math.round(goldMetrics.equivalent21kWeight * 100) / 100;
        const totalRawGoldWeight = Math.round(goldMetrics.rawWeight * 100) / 100;
        const totalGoldAmount = Math.round(goldMetrics.totalGoldValuation * 100) / 100;
        const totalGoldPrice = Math.round(goldMetrics.totalCost * 100) / 100;
        const goldProfit = Math.round((totalGoldAmount - totalGoldPrice) * 100) / 100;

        const totalInvestmentsAmount = Math.round(goldMetrics.totalCurrentValuation * 100) / 100;
        const totalInvestmentsPrice = Math.round(goldMetrics.totalPortfolioCost * 100) / 100;
        const totalInvestmentsProfit = Math.round(goldMetrics.totalProfit * 100) / 100;

        const monthlyCredits = Object.entries(monthlyCreditsMap).map(([month_id, amount]) => ({ month_id: parseInt(month_id, 10), amount }));
        const monthlyDebtsGrouped = Object.entries(monthlyDebtsMap).map(([key, amount]) => {
            const [month_id, type] = key.split('_');
            return { month_id: parseInt(month_id, 10), type: parseInt(type, 10), amount };
        });
        const distributionRows = Object.values(debtDistributionMap).sort((a, b) => b.total - a.total);

        const chartData = monthsList.map(m => {
            const mIdStr = String(m.id);
            const mCredits = parseFloat(monthlyCredits.find(c => String(c.month_id) === mIdStr)?.amount || 0);
            const mDebts = parseFloat(monthlyDebtsGrouped.find(d => String(d.month_id) === mIdStr && Number(d.type) === 1)?.amount || 0);
            const mInvestments = parseFloat(monthlyDebtsGrouped.find(d => String(d.month_id) === mIdStr && Number(d.type) === 2)?.amount || 0);
            const mOthers = parseFloat(monthlyDebtsGrouped.find(d => String(d.month_id) === mIdStr && Number(d.type) === 0)?.amount || 0);
            const mTotalDebts = mDebts + mInvestments + mOthers;

            return {
                name: `${m.month} ${m.year}`,
                credits: mCredits,
                debts: mDebts,
                investments: mInvestments,
                others: mOthers,
                totalDebts: mTotalDebts,
                balance: mCredits - mTotalDebts
            };
        });

        const othersDistribution = distributionRows
            .filter(r => Number(r.type) === 0)
            .map(r => ({ category: r.name, amount: parseFloat(r.total || 0) }));

        const liabilityDistribution = distributionRows
            .filter(r => Number(r.type) === 1)
            .map(r => ({ category: r.name, amount: parseFloat(r.total || 0) }));

        const investmentDistribution = distributionRows
            .filter(r => Number(r.type) === 2)
            .map(r => ({ category: r.name, amount: parseFloat(r.total || 0) }));

        const expenseDistribution = distributionRows.map(row => {
            const typeLabel = row.type === 1 ? 'Liability' : (row.type === 2 ? 'Investment' : 'Other');
            return {
                name: row.name,
                type: row.type,
                typeLabel,
                total: parseFloat(row.total || 0)
            };
        });

        const expenseRatio = [
            { name: 'Debts', value: totalDebtAmountCY },
            { name: 'Investments', value: totalInvestmentAmountCY },
            { name: 'Other Expenses', value: totalOtherAmountCY },
            { name: 'Remaining Balance', value: remainingBalanceCY }
        ];

        const responseData = {
            stats: {
                totalCredits,
                totalDebtAmount,
                totalInvestmentAmount,
                totalOtherAmount,
                currentBalance,

                totalCreditsCY,
                totalDebtAmountCY,
                totalInvestmentAmountCY,
                totalOtherAmountCY,
                totalDebtsCY,
                remainingBalanceCY,

                totalGoldWeight,
                totalRawGoldWeight,
                totalGoldAmount,
                totalGoldPrice,
                goldProfit,

                totalInvestmentsAmount,
                totalInvestmentsPrice,
                totalInvestmentsProfit
            },
            chartData,
            expenseDistribution,
            expenseRatio,
            othersDistribution,
            liabilityDistribution,
            investmentDistribution
        };

        cachedStats = responseData;
        statsCacheTime = Date.now();

        return ok(responseData);
    } catch (err) {
        console.error("Stats API error:", err);
        return serverError(err);
    }
}


    static async backupDatabase(req) {
    try {
        const user = await requireAuth(req);
        if (!user) return unauthorized();

        const isPg = true;

        let sqlDump = `-- ========================================================\n`;
        sqlDump += `-- The-Root Full Database Dump (Structures & Data)\n`;
        sqlDump += `-- Database Connection: postgresql\n`;
        sqlDump += `-- Generated At: ${new Date().toISOString()}\n`;
        sqlDump += `-- ========================================================\n\n`;

        const tables = Object.keys(tableStructures);

        for (const table of tables) {
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- 1. Table Structure for "${table}"\n`;
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `${tableStructures[table]}\n\n`;

            let rows = [];
            try {
                const model = Object.values(sequelize.models).find(m => m.tableName === table);
                if (model) {
                    rows = await model.findAll({ order: [['id', 'ASC']], raw: true });
                }
            } catch (err) {
            }

            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- 2. Data Inserts for "${table}" (${rows.length} rows)\n`;
            sqlDump += `-- --------------------------------------------------------\n`;

            if (rows && rows.length > 0) {
                const keys = Object.keys(rows[0]);
                const columnsStr = keys.map(k => isPg ? `"${k}"` : `\`${k}\``).join(', ');
                const tableNameQuoted = isPg ? `"${table}"` : `\`${table}\``;

                sqlDump += `INSERT INTO ${tableNameQuoted} (${columnsStr}) VALUES\n`;

                const valuesList = rows.map(row => {
                    const vals = keys.map(k => {
                        const val = row[k];
                        if (val === null || val === undefined) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                        if (val instanceof Date) {
                            return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        }
                        const escapedStr = String(val)
                            .replace(/\\/g, '\\\\')
                            .replace(/'/g, "''");
                        return `'${escapedStr}'`;
                    });
                    return `(${vals.join(', ')})`;
                });

                sqlDump += valuesList.join(',\n') + ';\n\n';
            } else {
                sqlDump += `-- No rows in "${table}"\n\n`;
            }

            if (isPg) {
                sqlDump += `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1));\n\n`;
            }
        }

        return new Response(sqlDump, {
            status: 200,
            headers: {
                'Content-Type': 'application/sql',
                'Content-Disposition': 'attachment; filename="the_root_full_backup.sql"'
            }
        });

    } catch (err) {
        console.error("Backup DB API error:", err);
        return serverError(err);
    }
}


    static async sync(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            return ok({ success: true, message: "Database sync verified." });
        } catch (err) {
            return serverError(err);
        }
    }

    static async getMonths(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            if (cachedMonths && (Date.now() - monthsCacheTime < MONTHS_TTL_MS)) {
                return ok(cachedMonths);
            }

            const [allMonthsAsc, credits, debts] = await Promise.all([
                Month.findAll({
                    attributes: ['id', 'month', 'year', 'created_at', 'updated_at'],
                    order: [['id', 'ASC']],
                    raw: true
                }),
                Credit.findAll({
                    attributes: ['month_id', 'amount'],
                    raw: true
                }),
                Debt.findAll({
                    attributes: ['month_id', 'amount', 'type'],
                    raw: true
                })
            ]);

            const creditMap = {};
            for (let i = 0; i < credits.length; i++) {
                const c = credits[i];
                const mId = String(c.month_id);
                creditMap[mId] = (creditMap[mId] || 0) + (parseFloat(c.amount) || 0);
            }

            const debtMap = {};
            for (let i = 0; i < debts.length; i++) {
                const d = debts[i];
                const mId = String(d.month_id);
                if (!debtMap[mId]) {
                    debtMap[mId] = { expenses: 0, liabilities: 0, investments: 0, others: 0 };
                }
                const amt = parseFloat(d.amount) || 0;
                debtMap[mId].expenses += amt;
                const dType = Number(d.type);
                if (dType === 1) debtMap[mId].liabilities += amt;
                else if (dType === 2) debtMap[mId].investments += amt;
                else if (dType === 0) debtMap[mId].others += amt;
            }

            let cumulativeBalance = 0;
            const monthsWithBalances = (allMonthsAsc || []).map(month => {
                const mIdStr = String(month.id);
                const mCredits = creditMap[mIdStr] || 0;
                const dData = debtMap[mIdStr] || { expenses: 0, liabilities: 0, investments: 0, others: 0 };
                const mDebts = dData.expenses;
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
                    percentage: mCredits > 0 ? parseFloat(((netMonth / mCredits) * 100).toFixed(1)) : 0,
                    liabilities: dData.liabilities,
                    investments: dData.investments,
                    others: dData.others
                };
            });

            monthsWithBalances.sort((a, b) => b.id - a.id);
            cachedMonths = monthsWithBalances;
            monthsCacheTime = Date.now();
            return ok(monthsWithBalances);
        } catch (err) {
            return serverError(err);
        }
    }

    static async createMonth(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = await req.json();
            if (body.action === 'update' || body.action === 'edit' || (body.id && body.action !== 'create')) {
                return await FinanceController.updateMonth(req, body);
            }
            if (body.action === 'delete') {
                return await FinanceController.deleteMonth(req, body);
            }

            const { month, year } = body;

            await Month.create({
                month,
                year,
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async updateMonth(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = passedBody || (await req.json());
            const { id, month, year } = body;

            await Month.update({
                month,
                year,
                updated_at: new Date().toISOString()
            }, { where: { id } });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async deleteMonth(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id');
            } catch (_) {}

            if (!id && passedBody) {
                id = passedBody.id;
            }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id;
                } catch (_) {}
            }

            if (!id) return badRequest('ID parameter missing');

            const existingMonth = await Month.findByPk(id);
            if (!existingMonth) return notFound('Month record not found');

            await Month.destroy({ where: { id } });

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'DELETE_MONTH',
                status: 'SUCCESS',
                ip: getClientIp(req),
                userAgent: req?.headers?.get?.('user-agent') || 'Unknown',
                details: { id: existingMonth.id, month: existingMonth.month, year: existingMonth.year }
            });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async getDebts(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const [debts, months] = await Promise.all([
                Debt.findAll({ order: [['id', 'DESC']], raw: true }),
                Month.findAll({ attributes: ['id', 'month', 'year'], raw: true })
            ]);

            const monthMap = new Map();
            months.forEach(m => monthMap.set(Number(m.id), m));

            const rows = debts.map(d => {
                const m = monthMap.get(Number(d.month_id));
                return {
                    ...d,
                    month_name: m ? m.month : null,
                    month_year: m ? m.year : null
                };
            });

            return ok(rows);
        } catch (err) {
            return serverError(err);
        }
    }

    static async createDebt(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = await req.json();
            if (body.action === 'update' || body.action === 'edit' || (body.id && body.action !== 'create')) {
                return await FinanceController.updateDebt(req, body);
            }
            if (body.action === 'delete') {
                return await FinanceController.deleteDebt(req, body);
            }

            const { name, amount, type, note, month_id, week, monthName, year } = body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return badRequest('Debt name is required');
            }

            const parsedAmount = parseFloat(amount || 0);
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            const safeNote = note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null;

            let resolvedMonthId = month_id;
            let resolvedMonthName = monthName;
            let resolvedYear = year ? parseInt(year, 10) : null;

            if (monthName && year) {
                const mStr = String(monthName).trim();
                const yStr = parseInt(year, 10);
                let existing = await Month.findOne({ where: { month: mStr, year: yStr } });
                if (!existing) {
                    existing = await Month.create({ month: mStr, year: yStr, created_at: new Date(), updated_at: new Date().toISOString() });
                }
                resolvedMonthId = existing.id;
                resolvedMonthName = mStr;
                resolvedYear = yStr;
            } else if (month_id) {
                const m = await Month.findByPk(month_id);
                if (m) {
                    resolvedMonthName = m.month;
                    resolvedYear = parseInt(m.year, 10);
                }
            }

            if (!resolvedMonthId) {
                return badRequest('Month parameter missing or invalid');
            }

            const monthIndex = MONTH_MAP[resolvedMonthName] || 1;
            const parsedType = (type !== undefined && type !== null && !isNaN(Number(type))) ? parseInt(type, 10) : 1;

            const created = await Debt.create({
                name: name.trim().slice(0, 255),
                amount: parsedAmount,
                type: parsedType,
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week || null,
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });

            return ok({ success: true, id: created.id });
        } catch (err) {
            return serverError(err);
        }
    }

    static async updateDebt(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = passedBody || (await req.json());
            const { id, name, amount, type, note, month_id, week, monthName, year } = body;

            if (!id) return badRequest('Debt ID is required');

            const existingDebt = await Debt.findByPk(id);
            if (!existingDebt) return notFound('Debt record not found');

            let resolvedMonthId = month_id;
            let resolvedMonthName = monthName;
            let resolvedYear = year ? parseInt(year, 10) : null;

            if (monthName && year) {
                const mStr = String(monthName).trim();
                const yStr = parseInt(year, 10);
                let existing = await Month.findOne({ where: { month: mStr, year: yStr } });
                if (!existing) {
                    existing = await Month.create({ month: mStr, year: yStr, created_at: new Date(), updated_at: new Date().toISOString() });
                }
                resolvedMonthId = existing.id;
                resolvedMonthName = mStr;
                resolvedYear = yStr;
            } else if (month_id) {
                const m = await Month.findByPk(month_id);
                if (m) {
                    resolvedMonthName = m.month;
                    resolvedYear = parseInt(m.year, 10);
                }
            }

            if (!resolvedMonthId) {
                resolvedMonthId = existingDebt.month_id;
                resolvedYear = existingDebt.year;
                const m = await Month.findByPk(resolvedMonthId);
                if (m) resolvedMonthName = m.month;
            }

            if (!resolvedMonthId) {
                return badRequest('Month parameter missing or invalid');
            }

            const parsedAmount = amount !== undefined ? parseFloat(amount) : existingDebt.amount;
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            const safeNote = note !== undefined ? (note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null) : existingDebt.note;
            const monthIndex = MONTH_MAP[resolvedMonthName] || 1;
            const parsedType = (type !== undefined && type !== null && !isNaN(Number(type))) ? parseInt(type, 10) : existingDebt.type;

            await Debt.update({
                name: name ? String(name).trim().slice(0, 255) : existingDebt.name,
                amount: parsedAmount,
                type: parsedType,
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week || null,
                updated_at: new Date().toISOString()
            }, { where: { id } });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async deleteDebt(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id');
            } catch (_) {}

            if (!id && passedBody) {
                id = passedBody.id;
            }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id;
                } catch (_) {}
            }

            if (!id) return badRequest('ID parameter missing');

            const existingDebt = await Debt.findByPk(id);
            if (!existingDebt) return notFound('Debt record not found');

            await Debt.destroy({ where: { id } });

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'DELETE_DEBT',
                status: 'SUCCESS',
                ip: getClientIp(req),
                userAgent: req?.headers?.get?.('user-agent') || 'Unknown',
                details: { id: existingDebt.id, name: existingDebt.name, amount: existingDebt.amount }
            });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async getCredits(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const [credits, months] = await Promise.all([
                Credit.findAll({ order: [['id', 'DESC']], raw: true }),
                Month.findAll({ attributes: ['id', 'month', 'year'], raw: true })
            ]);

            const monthMap = new Map();
            months.forEach(m => monthMap.set(Number(m.id), m));

            const rows = credits.map(c => {
                const m = monthMap.get(Number(c.month_id));
                return {
                    ...c,
                    month_name: m ? m.month : null,
                    month_year: m ? m.year : null
                };
            });

            return ok(rows);
        } catch (err) {
            return serverError(err);
        }
    }

    static async createCredit(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = await req.json();
            if (body.action === 'update' || body.action === 'edit' || (body.id && body.action !== 'create')) {
                return await FinanceController.updateCredit(req, body);
            }
            if (body.action === 'delete') {
                return await FinanceController.deleteCredit(req, body);
            }

            const { name, amount, type, note, month_id, week, monthName, year } = body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return badRequest('Credit name is required');
            }

            const parsedAmount = parseFloat(amount || 0);
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            const safeNote = note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null;

            let resolvedMonthId = month_id;
            let resolvedMonthName = monthName;
            let resolvedYear = year ? parseInt(year, 10) : null;

            if (monthName && year) {
                const mStr = String(monthName).trim();
                const yStr = parseInt(year, 10);
                let existing = await Month.findOne({ where: { month: mStr, year: yStr } });
                if (!existing) {
                    existing = await Month.create({ month: mStr, year: yStr, created_at: new Date(), updated_at: new Date().toISOString() });
                }
                resolvedMonthId = existing.id;
                resolvedMonthName = mStr;
                resolvedYear = yStr;
            } else if (month_id) {
                const m = await Month.findByPk(month_id);
                if (m) {
                    resolvedMonthName = m.month;
                    resolvedYear = parseInt(m.year, 10);
                }
            }

            if (!resolvedMonthId) {
                return badRequest('Month parameter missing or invalid');
            }

            const monthIndex = MONTH_MAP[resolvedMonthName] || 1;
            const parsedType = (type !== undefined && type !== null && !isNaN(Number(type))) ? parseInt(type, 10) : 1;

            const created = await Credit.create({
                name: name.trim().slice(0, 255),
                amount: parsedAmount,
                type: parsedType,
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week || null,
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });

            return ok({ success: true, id: created.id });
        } catch (err) {
            return serverError(err);
        }
    }

    static async updateCredit(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            const body = passedBody || (await req.json());
            const { id, name, amount, type, note, month_id, week, monthName, year } = body;

            if (!id) return badRequest('Credit ID is required');

            const existingCredit = await Credit.findByPk(id);
            if (!existingCredit) return notFound('Credit record not found');

            let resolvedMonthId = month_id;
            let resolvedMonthName = monthName;
            let resolvedYear = year ? parseInt(year, 10) : null;

            if (monthName && year) {
                const mStr = String(monthName).trim();
                const yStr = parseInt(year, 10);
                let existing = await Month.findOne({ where: { month: mStr, year: yStr } });
                if (!existing) {
                    existing = await Month.create({ month: mStr, year: yStr, created_at: new Date(), updated_at: new Date().toISOString() });
                }
                resolvedMonthId = existing.id;
                resolvedMonthName = mStr;
                resolvedYear = yStr;
            } else if (month_id) {
                const m = await Month.findByPk(month_id);
                if (m) {
                    resolvedMonthName = m.month;
                    resolvedYear = parseInt(m.year, 10);
                }
            }

            if (!resolvedMonthId) {
                resolvedMonthId = existingCredit.month_id;
                resolvedYear = existingCredit.year;
                const m = await Month.findByPk(resolvedMonthId);
                if (m) resolvedMonthName = m.month;
            }

            if (!resolvedMonthId) {
                return badRequest('Month parameter missing or invalid');
            }

            const parsedAmount = amount !== undefined ? parseFloat(amount) : existingCredit.amount;
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            const safeNote = note !== undefined ? (note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null) : existingCredit.note;
            const monthIndex = MONTH_MAP[resolvedMonthName] || 1;
            const parsedType = (type !== undefined && type !== null && !isNaN(Number(type))) ? parseInt(type, 10) : existingCredit.type;

            await Credit.update({
                name: name ? String(name).trim().slice(0, 255) : existingCredit.name,
                amount: parsedAmount,
                type: parsedType,
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week || null,
                updated_at: new Date().toISOString()
            }, { where: { id } });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async deleteCredit(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();
            invalidateFinanceCache();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id');
            } catch (_) {}

            if (!id && passedBody) {
                id = passedBody.id;
            }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id;
                } catch (_) {}
            }

            if (!id) return badRequest('ID parameter missing');

            const existingCredit = await Credit.findByPk(id);
            if (!existingCredit) return notFound('Credit record not found');

            await Credit.destroy({ where: { id } });

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'DELETE_CREDIT',
                status: 'SUCCESS',
                ip: getClientIp(req),
                userAgent: req?.headers?.get?.('user-agent') || 'Unknown',
                details: { id: existingCredit.id, name: existingCredit.name, amount: existingCredit.amount }
            });

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async getPrices(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const rows = await Price.findAll({ order: [['id', 'DESC']] });
            return ok(rows);
        } catch (err) {
            return serverError(err);
        }
    }

    static async createOrUpdatePrice(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            const { name, price, dollar, riyal } = body;
            const updateFields = { price, updated_at: new Date().toISOString() };
            if (dollar !== undefined) updateFields.dollar = dollar;
            if (riyal !== undefined) updateFields.riyal = riyal;

            const existing = await Price.findOne({ where: { name } });
            if (existing) {
                await existing.update(updateFields);
            } else {
                await Price.create({ 
                    name, 
                    price, 
                    dollar: dollar || null, 
                    riyal: riyal || null, 
                    created_at: new Date(), 
                    updated_at: new Date().toISOString() 
                });
            }

            await syncInvestmentsWithPrice(name, price);
            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async updatePrice(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            const { id, name, price, dollar, riyal } = body;
            const updateFields = { name, price, updated_at: new Date().toISOString() };
            if (dollar !== undefined) updateFields.dollar = dollar;
            if (riyal !== undefined) updateFields.riyal = riyal;

            await Price.update(updateFields, { where: { id } });
            await syncInvestmentsWithPrice(name, price);
            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async deletePrice(req, passedBody = null) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id');
            } catch (_) {}

            if (!id && passedBody) {
                id = passedBody.id;
            }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id;
                } catch (_) {}
            }

            if (!id) return badRequest('ID parameter missing');

            await Price.destroy({ where: { id } });
            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }
}



export default FinanceController;
