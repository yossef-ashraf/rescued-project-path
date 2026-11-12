/**
 * Treasury Service
 * Architecture v2
 */

export function calculateNetBalance(inflows = 0, outflows = 0) {
    const income = Number(inflows) || 0;
    const expense = Number(outflows) || 0;
    return {
        income,
        expense,
        net: income - expense,
        savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0
    };
}

export function computeGoldValuation(goldAssets = [], currentPricePerGram = 0) {
    const price = Number(currentPricePerGram) || 0;
    let totalGrams = 0;
    let totalCost = 0;

    goldAssets.forEach((g) => {
        const grams = Number(g.weight_grams) || 0;
        const buyPrice = Number(g.purchase_price_per_gram) || 0;
        totalGrams += grams;
        totalCost += grams * buyPrice;
    });

    const currentValue = totalGrams * price;
    const profitLoss = currentValue - totalCost;

    return {
        totalGrams,
        totalCost,
        currentValue,
        profitLoss,
        profitPercentage: totalCost > 0 ? Math.round((profitLoss / totalCost) * 100) : 0
    };
}

const serviceExports = {
    calculateNetBalance,
    computeGoldValuation
};

export default serviceExports;
