import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchFinancePrices() {
  const res = await apiClient('/api/finance/prices');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function saveFinancePrice(payload, isEdit = false, selectedId = null) {
  const body = isEdit ? { ...payload, id: selectedId } : payload;
  return apiClient('/api/finance/prices', {
    method: isEdit ? 'PUT' : 'POST',
    body
  });
}

export async function deleteFinancePrice(id) {
  return apiClient.delete(`/api/finance/prices?id=${id}`);
}

export async function syncGoldServicePrice() {
  return apiClient('/api/gold-service');
}

