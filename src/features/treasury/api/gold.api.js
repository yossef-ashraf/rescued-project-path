import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchGoldAssets() {
  const json = await apiClient('/api/finance/gold').catch(() => []);
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  return [];
}

export async function fetchFinanceMonths() {
  const json = await apiClient('/api/finance/months').catch(() => []);
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  return [];
}

export async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', 'investments');
  return apiClient.post('/api/upload', formData);
}

export async function submitGoldAsset(payload, isEdit = false) {
  return apiClient('/api/finance/gold', {
    method: isEdit ? 'PUT' : 'POST',
    body: payload
  });
}

export async function deleteGoldAsset(id) {
  return apiClient.delete(`/api/finance/gold?id=${id}`);
}

