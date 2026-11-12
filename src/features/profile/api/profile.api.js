import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchDriveFiles() {
    const data = await apiClient('/api/google-drive/files').catch(() => ({}));
    const files = data?.files || data?.data?.files || (Array.isArray(data) ? data : []);
    return Array.isArray(files) ? files : [];
}

export async function fetchLeads() {
    const data = await apiClient('/api/leads').catch(() => []);
    return Array.isArray(data) ? data : (data?.data || []);
}

export async function fetchLeadDetails(leadId) {
    return apiClient(`/api/leads?leadId=${leadId}`);
}

export async function fetchProfileData() {
    return apiClient('/api/profile');
}

export async function saveProfileData(payload) {
    return apiClient.post('/api/profile', payload);
}

export async function uploadProfileMedia(file, entityName) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'profile');
    formData.append('entityName', entityName);
    return apiClient.post('/api/upload', formData);
}

export async function createLead(leadData) {
    return apiClient.post('/api/leads', leadData);
}

export async function updateLead(leadData) {
    return apiClient.post('/api/leads', { action: 'update', ...leadData });
}

export async function addLeadComment(leadId, text, files = []) {
    return apiClient.post('/api/leads', {
        action: 'add_comment',
        id: leadId,
        text,
        files
    });
}

export async function updateLeadStatus(id, newStatus) {
    return apiClient.post('/api/leads', { action: 'update_status', id, status: newStatus });
}

export async function deleteLeadAttachment(attachmentId) {
    return apiClient.post('/api/leads', { action: 'delete_attachment', attachmentId });
}

export async function deleteLeadComment(commentId) {
    return apiClient.post('/api/leads', { action: 'delete_comment', commentId });
}

export async function deleteLead(id) {
    return apiClient.post('/api/leads', { action: 'delete', id });
}

