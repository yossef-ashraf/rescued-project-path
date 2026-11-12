import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchDebtsList() {
  const res = await apiClient('/api/finance/debts');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function fetchFinanceMonths() {
  const res = await apiClient('/api/finance/months');
  return Array.isArray(res) ? res : (res?.data || []);
}

export async function saveDebt(payload, isEdit = false, selectedId = null) {
  const url = '/api/finance/debts';
  const method = isEdit ? 'PUT' : 'POST';
  const body = isEdit ? { ...payload, id: selectedId } : payload;

  return apiClient(url, {
    method,
    body
  });
}

export async function deleteDebt(id) {
  return apiClient.delete(`/api/finance/debts?id=${id}`);
}

