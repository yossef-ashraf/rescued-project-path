import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchDriveFiles() {
    return apiClient('/api/google-drive/files');
}

export async function fetchSettings() {
    return apiClient('/api/settings');
}

export async function saveSettings(form) {
    return apiClient.post('/api/settings', form);
}

export async function fetchFinanceMonths() {
    return apiClient('/api/finance/months');
}

export async function fetchLocalMedia() {
    return apiClient('/api/media-download');
}

export async function fetchUsers() {
    return apiClient('/api/users');
}

export async function addUser(userData) {
    return apiClient.post('/api/users', userData);
}

export async function updateUser(userData) {
    return apiClient.put('/api/users', userData);
}

export async function changeUserPassword(id, newPassword) {
    return apiClient.put('/api/users', { id, newPassword });
}

export async function toggleUserRole(id) {
    return apiClient.post('/api/users', { action: 'toggle_role', id });
}

export async function deleteUser(id) {
    return apiClient.delete('/api/users', { body: { id } });
}

export async function renameUser(id, newUsername) {
    return apiClient.post('/api/users', { action: 'rename', id, newUsername });
}

export async function logoutAllSessions(payload = { all: true }) {
    return apiClient.post('/api/auth/logout-all', payload);
}

export async function triggerGoldSync() {
    return apiClient('/api/gold-service');
}

export async function triggerExportDownload(exportUrl) {
    return fetch(exportUrl, { credentials: 'same-origin' });
}

export function normalizeNotifications(data) {
    const items = Array.isArray(data)
        ? data
        : (data?.notifications || data?.data || []);
    return items.map((n, idx) => ({
        id: n.id ?? `event-${idx}`,
        type: ['success', 'todo_due', 'info', 'warning'].includes(n.type) ? n.type : 'info',
        title: n.title || 'Notification',
        message: n.message || '',
        created_at: n.created_at || new Date().toISOString(),
        is_read: Boolean(n.is_read),
        link: n.link || null
    }));
}

export async function fetchNotifications({ limit = 8 } = {}) {
    const json = await apiClient(`/api/notifications?limit=${limit}`);
    return normalizeNotifications(json);
}

export async function markNotificationAsRead(id) {
    return apiClient.post('/api/notifications', { action: 'read', id });
}

export async function fetchVaultPasswords(masterKey = '') {
    return apiClient.post('/api/passwords', { action: 'list', masterKey });
}

export async function saveVaultPassword(payload) {
    return apiClient.post('/api/passwords', payload);
}

export async function deleteVaultPassword(id) {
    return apiClient.post('/api/passwords', { action: 'delete', id });
}
