import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchCreditsList() {
  const res = await apiClient('/api/finance/credits');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function fetchFinanceMonths() {
  const res = await apiClient('/api/finance/months');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function saveCredit(payload, isEdit = false, selectedId = null) {
  const url = '/api/finance/credits';
  const method = isEdit ? 'PUT' : 'POST';
  const body = isEdit ? { ...payload, id: selectedId } : payload;

  return apiClient(url, {
    method,
    body
  });
}

export async function deleteCredit(id) {
  return apiClient.delete(`/api/finance/credits?id=${id}`);
}

