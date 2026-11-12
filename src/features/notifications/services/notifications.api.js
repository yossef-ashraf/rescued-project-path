import { apiClient } from '@/shared/http/apiClient.js';


export async function fetchNotificationsApi() {
    return apiClient('/api/notifications');
}

export async function markNotificationAsReadApi(id) {
    return apiClient.post('/api/notifications', {
        action: 'mark_read',
        id
    });
}

export async function markAllNotificationsAsReadApi() {
    return apiClient.post('/api/notifications', {
        action: 'mark_read'
    });
}
