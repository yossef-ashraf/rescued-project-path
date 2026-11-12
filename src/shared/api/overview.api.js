import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchFinanceStats() {
    return apiClient('/api/finance/stats');
}

export async function fetchMonthsData() {
    return apiClient('/api/finance/months');
}

