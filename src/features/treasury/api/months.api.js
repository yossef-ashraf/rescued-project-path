import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchFinanceMonths() {
  const res = await apiClient('/api/finance/months');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function saveFinanceMonth(payload, isEdit = false, selectedId = null) {
  const body = isEdit ? { ...payload, id: selectedId } : payload;
  return apiClient('/api/finance/months', {
    method: isEdit ? 'PUT' : 'POST',
    body
  });
}

export async function deleteFinanceMonth(id) {
  return apiClient.delete(`/api/finance/months?id=${id}`);
}

