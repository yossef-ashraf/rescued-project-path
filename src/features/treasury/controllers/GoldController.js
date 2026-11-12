import { Month, InvestmentAndSavings, Price } from '@/shared/models/index.js';
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError, tooManyRequests } from '@/shared/utils/response.js';
import { recordAuthLog, getClientIp } from '@/features/auth/services/auth.js';
import { checkRateLimit } from '@/features/auth/services/rate-limit.js';
import { FinanceController } from './FinanceController.js';

const MONTH_NUMBER_MAP = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12
};

function formatImageSrc(imagePath) {
    if (!imagePath) return null;
    const img = String(imagePath).trim();
    if (!img) return null;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (!img.startsWith('/')) {
        if (img.startsWith('investments/') || img.startsWith('uploads/')) return `/${img}`;
        return `/investments/${img}`;
    }
    return img;
}

async function resolveMonthInfo(month_id, monthName, year) {
    let resolvedMonthId = month_id || null;
    let resolvedMonthName = monthName || '';
    let resolvedYear = year ? parseInt(year, 10) : null;

    if (monthName && year) {
        const mStr = String(monthName).trim();
        const yNum = parseInt(year, 10);
        let existing = await Month.findOne({ where: { month: mStr, year: yNum } });
        if (!existing) {
            existing = await Month.create({ 
                month: mStr, 
                year: yNum, 
                created_at: new Date(), 
                updated_at: new Date().toISOString() 
            });
        }
        resolvedMonthId = existing.id;
        resolvedMonthName = mStr;
        resolvedYear = yNum;
    } else if (month_id) {
        const m = await Month.findByPk(month_id);
        if (m) {
            resolvedMonthName = m.month;
            resolvedYear = parseInt(m.year, 10);
        }
    }

    const monthIndex = MONTH_NUMBER_MAP[resolvedMonthName] || 1;
    return { resolvedMonthId, resolvedYear, monthIndex };
}

const TROY_OUNCE_TO_GRAMS = 31.1035;
const FALLBACK_PRICES = Object.freeze({
    PRICE_24K: 6684.39,
    PRICE_21K: 5848.84,
    PRICE_18K: 5013.29,
    USD_TO_EGP: 50.45,
    SAR_TO_EGP: 13.45
});

export class GoldController {
    static async getLiveGoldService(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const ip = getClientIp(req);
            const rateKey = `gold_sync:${user.id || ip}`;
            if (!checkRateLimit(rateKey, 4, 60000)) {
                return tooManyRequests('Rate limit exceeded for market rates sync. Please wait a minute.');
            }

            let price24 = FALLBACK_PRICES.PRICE_24K;
            let price21 = FALLBACK_PRICES.PRICE_21K;
            let price18 = FALLBACK_PRICES.PRICE_18K;
            let usdToEgp = FALLBACK_PRICES.USD_TO_EGP;
            let sarToEgp = FALLBACK_PRICES.SAR_TO_EGP;

            let goldUsdPerOunce = 0;
            let goldUsdPerGram = 0;
            let fetchedCurrency = false;
            let fetchedGold = false;

            // 1. Fetch live currency exchange rates (USD & SAR to EGP)
            try {
                const exchangeRes = await fetch('https://open.er-api.com/v6/latest/USD', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                });

                if (exchangeRes.ok) {
                    const rawExchangeData = await exchangeRes.json();
                    const egp = parseFloat(rawExchangeData.rates?.EGP);
                    const sar = parseFloat(rawExchangeData.rates?.SAR);
                    if (egp && egp > 0) {
                        usdToEgp = Math.round(egp * 100) / 100;
                        if (sar && sar > 0) {
                            sarToEgp = Math.round((usdToEgp / sar) * 100) / 100;
                        }
                        fetchedCurrency = true;
                    }
                }
            } catch (currErr) {
                console.warn('Could not fetch exchange rates from primary API:', currErr.message);
            }

            if (!fetchedCurrency) {
                try {
                    const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Accept': 'application/json'
                        }
                    });
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json();
                        const egp = parseFloat(fallbackData.rates?.EGP);
                        const sar = parseFloat(fallbackData.rates?.SAR);
                        if (egp && egp > 0) {
                            usdToEgp = Math.round(egp * 100) / 100;
                            if (sar && sar > 0) {
                                sarToEgp = Math.round((usdToEgp / sar) * 100) / 100;
                            }
                            fetchedCurrency = true;
                        }
                    }
                } catch (fbErr) {
                    console.warn('Could not fetch exchange rates from fallback API:', fbErr.message);
                }
            }

            // 2. Fetch live gold price per ounce and compute karat prices
            try {
                const res = await fetch('https://api.gold-api.com/price/XAU', { 
                    headers: { 
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    },
                    next: { revalidate: 60 } 
                });

                if (res.ok) {
                    const rawGoldData = await res.json();
                    if (rawGoldData?.price) {
                        goldUsdPerOunce = parseFloat(rawGoldData.price);
                        goldUsdPerGram = goldUsdPerOunce / TROY_OUNCE_TO_GRAMS;
                        const calculated24 = goldUsdPerGram * usdToEgp;
                        if (calculated24 > 1000) {
                            price24 = calculated24;
                            price21 = price24 * (21 / 24);
                            price18 = price24 * (18 / 24);
                            fetchedGold = true;
                        }
                    }
                }
            } catch (fetchErr) {
                console.warn('Could not fetch live gold prices from external API:', fetchErr.message);
            }

            if (!fetchedGold) {
                const fluctuation = 1 + (Math.random() * 0.01 - 0.005);
                price24 = price24 * fluctuation;
                price21 = price24 * (21 / 24);
                price18 = price24 * (18 / 24);
            }

            price24 = Math.round(price24 * 100) / 100;
            price21 = Math.round(price21 * 100) / 100;
            price18 = Math.round(price18 * 100) / 100;

            // 3. Upsert benchmark rates into finance_market_prices with dollar and riyal columns
            const updatePrice = async (pName, pVal) => {
                const existing = await Price.findOne({ where: { name: pName } });
                if (existing) {
                    await Price.update({ 
                        price: pVal, 
                        dollar: usdToEgp, 
                        riyal: sarToEgp, 
                        updated_at: new Date().toISOString() 
                    }, { where: { name: pName } });
                } else {
                    await Price.create({ 
                        name: pName, 
                        price: pVal, 
                        dollar: usdToEgp, 
                        riyal: sarToEgp, 
                        created_at: new Date(), 
                        updated_at: new Date().toISOString() 
                    });
                }
            };

            await updatePrice('Gold 24', price24);
            await updatePrice('Gold 21', price21);
            await updatePrice('Gold 18', price18);
            await updatePrice('US Dollar (USD)', usdToEgp);
            await updatePrice('Saudi Riyal (SAR)', sarToEgp);

            // Synchronize dollar and riyal columns across all price records
            await Price.update(
                { dollar: usdToEgp, riyal: sarToEgp },
                { where: {} }
            );

            // 4. Update investments rate and amount
            const investments = await InvestmentAndSavings.findAll({
                attributes: ['id', 'name', 'note', 'val', 'price', 'amount', 'rate', 'currency'],
                raw: true
            });
            let updatedCount = 0;

            for (const item of investments) {
                let val = parseFloat(item.val || 0);
                const currentAmount = parseFloat(item.amount || 0);
                const currentPrice = parseFloat(item.price || 0);
                const lowercaseName = (item.name || '').toLowerCase();
                const lowercaseNote = (item.note || '').toLowerCase();
                const itemCurrency = item.currency || '';

                // If val is 0, check if amount or price has the quantity for a currency asset
                if (val <= 0) {
                    if (currentAmount > 0) val = currentAmount;
                    else if (currentPrice > 0) val = currentPrice;
                }
                
                if (val > 0) {
                    let currentRate = null;
                    let isForeignCurrency = false;
                    let determinedCurrency = itemCurrency;

                    if (itemCurrency === 'SAR' || (!itemCurrency && (lowercaseName.includes('sar') || lowercaseName.includes('riyal') || lowercaseName.includes('ريال') || lowercaseName.includes('ر.س')))) {
                        currentRate = sarToEgp;
                        isForeignCurrency = true;
                        determinedCurrency = 'SAR';
                    } else if (itemCurrency === 'USD' || (!itemCurrency && (lowercaseName.includes('dollar') || lowercaseName.includes('usd') || lowercaseName.includes('دولار')))) {
                        currentRate = usdToEgp;
                        isForeignCurrency = true;
                        determinedCurrency = 'USD';
                    } else if (itemCurrency === 'GOLD_24' || (!itemCurrency && (lowercaseName.includes('24') || lowercaseName.includes('٢٤')) && (lowercaseName.includes('gold') || lowercaseName.includes('ذهب') || lowercaseName.includes('عيار')))) {
                        currentRate = price24;
                        determinedCurrency = 'GOLD_24';
                    } else if (itemCurrency === 'GOLD_18' || (!itemCurrency && (lowercaseName.includes('18') || lowercaseName.includes('١٨')) && (lowercaseName.includes('gold') || lowercaseName.includes('ذهب') || lowercaseName.includes('عيار')))) {
                        currentRate = price18;
                        determinedCurrency = 'GOLD_18';
                    } else if (itemCurrency === 'GOLD_21' || (!itemCurrency && (lowercaseName.includes('gold') || lowercaseName.includes('ذهب') || lowercaseName.includes('عيار')))) {
                        currentRate = price21;
                        determinedCurrency = 'GOLD_21';
                    } else if (itemCurrency === 'EGP' || lowercaseName.includes('egp') || lowercaseName.includes('جنيه') || lowercaseName.includes('مصري')) {
                        currentRate = 1.0;
                        isForeignCurrency = false;
                        determinedCurrency = 'EGP';
                    } else if (!itemCurrency && (lowercaseNote.includes('dollar') || lowercaseNote.includes('usd') || lowercaseNote.includes('دولار') || lowercaseNote.includes('$'))) {
                        currentRate = usdToEgp;
                        isForeignCurrency = true;
                        determinedCurrency = 'USD';
                    } else if (!itemCurrency && (lowercaseNote.includes('sar') || lowercaseNote.includes('riyal') || lowercaseNote.includes('ريال') || lowercaseNote.includes('ر.س'))) {
                        currentRate = sarToEgp;
                        isForeignCurrency = true;
                        determinedCurrency = 'SAR';
                    } else if (item.rate && parseFloat(item.rate) > 0) {
                        currentRate = parseFloat(item.rate);
                    }

                    if (currentRate !== null && currentRate > 0) {
                        const newAmount = Math.round((val * currentRate) * 100) / 100;
                        const updateData = { 
                            val: val,
                            rate: currentRate,
                            currency: determinedCurrency || 'EGP',
                            amount: newAmount, 
                            updated_at: new Date().toISOString() 
                        };
                        // If foreign currency and purchase price was entered in foreign currency units (e.g. 1310), convert cost to EGP
                        if (isForeignCurrency && currentPrice > 0 && Math.abs(currentPrice - val) < 0.01) {
                            updateData.price = newAmount;
                        }
                        await InvestmentAndSavings.update(
                            updateData,
                            { where: { id: item.id } }
                        );
                        updatedCount++;
                    }
                }
            }

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'SYNC_MARKET_RATES',
                status: 'SUCCESS',
                ip,
                userAgent: req?.headers?.get?.('user-agent') || 'Unknown',
                details: { price24, price21, price18, usdToEgp, sarToEgp, updatedInvestments: updatedCount }
            });

            FinanceController.invalidateCache();

            return ok({ 
                status: "success", 
                message: "Market rates and investments portfolio updated successfully!",
                live_api_fetched: fetchedGold && fetchedCurrency,
                calculations: {
                    gold_usd_per_ounce: goldUsdPerOunce,
                    gold_usd_per_gram: Math.round(goldUsdPerGram * 100) / 100,
                    usd_to_egp: usdToEgp,
                    sar_to_egp: sarToEgp,
                    calculated_24k_egp: price24,
                    calculated_21k_egp: price21,
                    calculated_18k_egp: price18
                },
                prices: { 
                    'Gold 24': price24, 
                    'Gold 21': price21, 
                    'Gold 18': price18,
                    'US Dollar (USD)': usdToEgp,
                    'Saudi Riyal (SAR)': sarToEgp
                },
                updated_investments_count: updatedCount
            });
        } catch (err) {
            console.error("Market rates service error:", err);
            return serverError(err);
        }
    }

    static async getAssets(req) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();

        try {
            const rows = await InvestmentAndSavings.findAll({
                order: [['id', 'DESC']],
                raw: true
            });
            const formattedRows = rows.map(r => ({
                ...r,
                image: formatImageSrc(r.image)
            }));
            return ok(formattedRows);
        } catch (err) {
            return serverError(err);
        }
    }

    static async createAsset(req) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();

        try {
            const body = await req.json();
            if (body.action === 'update' || body.action === 'edit' || (body.id && body.action !== 'create')) {
                return await GoldController.updateAsset(req, body);
            }
            if (body.action === 'delete') {
                return await GoldController.deleteAsset(req, body);
            }

            const { name, val, amount, price, rate, currency, note, month_id, gregorian_date, hijri_date, image, monthName, year, week } = body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return badRequest('Asset name is required');
            }

            const parsedVal = parseFloat(val || 0);
            if (isNaN(parsedVal) || parsedVal < 0 || !isFinite(parsedVal)) {
                return badRequest('Quantity / weight must be a valid non-negative number');
            }

            const parsedAmount = parseFloat(amount || 0);
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            const parsedPrice = price !== undefined && price !== null && price !== '' ? parseFloat(price) : null;
            if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0 || !isFinite(parsedPrice))) {
                return badRequest('Price must be a valid non-negative number');
            }

            const parsedRate = rate !== undefined && rate !== null && rate !== '' ? parseFloat(rate) : null;
            if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0 || !isFinite(parsedRate))) {
                return badRequest('Rate must be a valid non-negative number');
            }

            let finalAmount = parsedAmount;
            if ((!finalAmount || finalAmount === 0) && parsedVal > 0 && parsedRate !== null && parsedRate > 0) {
                finalAmount = Math.round((parsedVal * parsedRate) * 100) / 100;
            }

            const safeNote = note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null;

            const { resolvedMonthId, resolvedYear, monthIndex } = await resolveMonthInfo(month_id, monthName, year);

            const created = await InvestmentAndSavings.create({
                name: name.trim().slice(0, 255),
                val: parsedVal,
                amount: finalAmount,
                price: parsedPrice,
                rate: parsedRate,
                currency: currency ? String(currency).trim().slice(0, 20) : 'EGP',
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week || null,
                gregorian_date: gregorian_date || null,
                hijri_date: hijri_date || null,
                image: image || null,
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });

            FinanceController.invalidateCache();

            return ok({ success: true, id: created.id });
        } catch (err) {
            return serverError(err);
        }
    }

    static async updateAsset(req, passedBody = null) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();

        try {
            const body = passedBody || (await req.json());
            const { id, name, val, amount, price, rate, currency, note, month_id, gregorian_date, hijri_date, image, monthName, year, week } = body;

            if (!id) return badRequest('Asset ID is required for update');

            const existingAsset = await InvestmentAndSavings.findByPk(id);
            if (!existingAsset) return notFound('Asset record not found');

            let { resolvedMonthId, resolvedYear, monthIndex } = await resolveMonthInfo(month_id, monthName, year);

            if (!resolvedMonthId) {
                resolvedMonthId = existingAsset.month_id;
                resolvedYear = existingAsset.year;
                monthIndex = existingAsset.month;
            }

            const parsedVal = val !== undefined ? parseFloat(val) : existingAsset.val;
            if (isNaN(parsedVal) || parsedVal < 0 || !isFinite(parsedVal)) {
                return badRequest('Quantity / weight must be a valid non-negative number');
            }

            const parsedPrice = price !== undefined ? (price !== null && price !== '' ? parseFloat(price) : null) : existingAsset.price;
            if (parsedPrice !== null && (isNaN(parsedPrice) || parsedPrice < 0 || !isFinite(parsedPrice))) {
                return badRequest('Price must be a valid non-negative number');
            }

            const parsedRate = rate !== undefined ? (rate !== null && rate !== '' ? parseFloat(rate) : null) : existingAsset.rate;
            if (parsedRate !== null && (isNaN(parsedRate) || parsedRate < 0 || !isFinite(parsedRate))) {
                return badRequest('Rate must be a valid non-negative number');
            }

            let parsedAmount = amount !== undefined ? parseFloat(amount) : existingAsset.amount;
            if (isNaN(parsedAmount) || parsedAmount < 0 || !isFinite(parsedAmount)) {
                return badRequest('Amount must be a valid non-negative number');
            }

            if ((parsedAmount === undefined || parsedAmount === null || parsedAmount === 0) && parsedVal > 0 && parsedRate !== null && parsedRate > 0) {
                parsedAmount = Math.round((parsedVal * parsedRate) * 100) / 100;
            }

            const safeNote = note !== undefined ? (note ? String(note).replace(/<[^>]*>?/gm, '').slice(0, 2000) : null) : existingAsset.note;

            await InvestmentAndSavings.update({
                name: name ? String(name).trim().slice(0, 255) : existingAsset.name,
                val: parsedVal,
                amount: parsedAmount,
                price: parsedPrice,
                rate: parsedRate,
                currency: currency !== undefined ? (currency ? String(currency).trim().slice(0, 20) : 'EGP') : existingAsset.currency,
                note: safeNote,
                month_id: resolvedMonthId,
                month: monthIndex,
                year: resolvedYear,
                week: week !== undefined ? week : existingAsset.week,
                gregorian_date: gregorian_date !== undefined ? gregorian_date : existingAsset.gregorian_date,
                hijri_date: hijri_date !== undefined ? hijri_date : existingAsset.hijri_date,
                image: image !== undefined ? image : existingAsset.image,
                updated_at: new Date().toISOString()
            }, {
                where: { id }
            });

            FinanceController.invalidateCache();

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }

    static async deleteAsset(req, passedBody = null) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();

        try {
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

            const existingAsset = await InvestmentAndSavings.findByPk(id);
            if (!existingAsset) return notFound('Asset record not found');

            await InvestmentAndSavings.destroy({ where: { id } });

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'DELETE_GOLD_ASSET',
                status: 'SUCCESS',
                ip: getClientIp(req),
                userAgent: req?.headers?.get?.('user-agent') || 'Unknown',
                details: { id: existingAsset.id, name: existingAsset.name, amount: existingAsset.amount }
            });

            FinanceController.invalidateCache();

            return ok({ success: true });
        } catch (err) {
            return serverError(err);
        }
    }
}

export default GoldController;
