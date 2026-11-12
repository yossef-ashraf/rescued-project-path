import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchFinancialReportsData() {
  const [resMonths, resCredits, resDebts, resGold, resPrices] = await Promise.all([
    apiClient('/api/finance/months').catch(() => []),
    apiClient('/api/finance/credits').catch(() => []),
    apiClient('/api/finance/debts').catch(() => []),
    apiClient('/api/gold').catch(() => []),
    apiClient('/api/finance/prices').catch(() => [])
  ]);

  return {
    months: Array.isArray(resMonths) ? resMonths : (resMonths?.data || []),
    credits: Array.isArray(resCredits) ? resCredits : (resCredits?.data || []),
    debts: Array.isArray(resDebts) ? resDebts : (resDebts?.data || []),
    goldAssets: Array.isArray(resGold) ? resGold : (resGold?.data || []),
    prices: Array.isArray(resPrices) ? resPrices : (resPrices?.data || [])
  };
}

