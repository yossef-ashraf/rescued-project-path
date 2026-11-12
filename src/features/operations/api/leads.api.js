import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchLeads() {
    const data = await apiClient('/api/leads').catch(() => []);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.leads)) return data.leads;
    return [];
}

export async function fetchDriveFiles() {
    const data = await apiClient('/api/google-drive/files').catch(() => ({}));
    const files = data?.files || data?.data?.files || (Array.isArray(data) ? data : []);
    return Array.isArray(files) ? files : [];
}

export async function createLead(payload) {
    return apiClient.post('/api/leads', payload);
}

export async function updateLead(payload) {
    return apiClient.post('/api/leads', {
        action: 'update',
        ...payload
    });
}

export async function updateLeadStatus(id, status) {
    return apiClient.post('/api/leads', { action: 'update_status', id, status });
}

export async function deleteLead(id) {
    return apiClient.post('/api/leads', { action: 'delete', id });
}

export async function fetchLeadDetails(leadId) {
    const res = await apiClient(`/api/leads?leadId=${leadId}`);
    return res?.data || res;
}

export async function uploadFileToServer(formData) {
    return apiClient.post('/api/upload', formData);
}

export async function addLeadAttachment(leadId, fileName, filePath) {
    return apiClient.post('/api/leads', {
        action: 'add_attachment',
        leadId,
        file_name: fileName,
        file_path: filePath
    });
}

export async function addLeadComment(leadId, text, files = []) {
    return apiClient.post('/api/leads', {
        action: 'add_comment',
        leadId,
        text,
        files
    });
}

export async function deleteLeadComment(commentId) {
    return apiClient.post('/api/leads', { action: 'delete_comment', commentId });
}

export async function deleteLeadAttachment(attachmentId) {
    return apiClient.post('/api/leads', { action: 'delete_attachment', attachmentId });
}

