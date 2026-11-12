import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchOverviewTasks() {
    return apiClient('/api/tasks');
}

export async function fetchOverviewNotes() {
    return apiClient('/api/notes');
}

export async function fetchOverviewTodos() {
    return apiClient('/api/todo');
}

export async function fetchOverviewCourses() {
    return apiClient('/api/courses?parent_id=all');
}

export async function createOverviewTask(taskData) {
    return apiClient.post('/api/tasks', {
        action: 'create_task',
        ...taskData
    });
}

export async function updateOverviewTaskDetails(taskData) {
    return apiClient.post('/api/tasks', {
        action: 'update_task',
        ...taskData
    });
}

export async function updateOverviewTaskStatus(taskId, status) {
    return apiClient.post('/api/tasks', {
        action: 'update_status',
        taskId,
        status
    });
}

export async function deleteOverviewTask(taskId) {
    return apiClient.post('/api/tasks', { action: 'delete_task', taskId });
}

