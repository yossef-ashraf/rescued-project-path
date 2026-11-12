import { apiClient } from '@/shared/http/apiClient.js';
import { uploadFileWithSync } from '@/shared/storage/upload-helper.js';

export async function fetchTasksList() {
    const res = await apiClient('/api/tasks');
    return Array.isArray(res) ? res : (res?.data || []);
}

export async function fetchTaskById(taskId) {
    const res = await apiClient(`/api/tasks?taskId=${taskId}`);
    return res?.data || res;
}

export async function fetchProjectsList() {
    const res = await apiClient('/api/projects');
    return Array.isArray(res) ? res : (res?.data || []);
}

export async function createTask(taskData) {
    return apiClient.post('/api/tasks', {
        action: 'create_task',
        ...taskData
    });
}

export async function updateTaskDetails(taskData) {
    return apiClient.post('/api/tasks', {
        action: 'update_task',
        ...taskData
    });
}

export async function updateTaskStatus(taskId, status) {
    return apiClient.post('/api/tasks', {
        action: 'update_status',
        taskId,
        status
    });
}

export async function deleteTask(taskId) {
    return apiClient.post('/api/tasks', { action: 'delete_task', taskId });
}

export async function addTaskComment(taskId, comment) {
    return apiClient.post('/api/tasks', { action: 'add_comment', taskId, comment });
}

export async function deleteTaskComment(commentId) {
    return apiClient.post('/api/tasks', { action: 'delete_comment', commentId });
}

export async function addTaskAttachment(taskId, attachmentData) {
    return apiClient.post('/api/tasks', {
        action: 'add_attachment',
        taskId,
        ...attachmentData
    });
}

export async function deleteTaskAttachment(attachmentId) {
    return apiClient.post('/api/tasks', { action: 'delete_attachment', attachmentId });
}


export async function uploadTaskFile(file, entityName) {
    return uploadFileWithSync(file, {
        entityType: 'task',
        entityName
    });
}
