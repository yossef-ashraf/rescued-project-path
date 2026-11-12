import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchTodoList() {
    const res = await apiClient('/api/todo');
    return Array.isArray(res) ? res : (res?.data || []);
}

export async function createTodoItem(payload) {
    return apiClient.post('/api/todo', payload);
}

export async function batchCreateTodoItems(items, defaultDueDate) {
    return apiClient.post('/api/todo', {
        action: 'batch_create_todos',
        items,
        due_date: defaultDueDate
    });
}

export async function toggleTodoItemDone(id, done) {
    return apiClient.post('/api/todo', {
        action: 'toggle_done',
        id,
        done
    });
}

export async function updateTodoItem(id, payload) {
    return apiClient.post('/api/todo', {
        action: 'edit_todo',
        id,
        ...payload
    });
}

export async function deleteTodoPoint(id) {
    return apiClient.post('/api/todo', { action: 'delete_item', id });
}

export async function deleteTodoDay(dateStr) {
    return apiClient.post('/api/todo', { action: 'delete_day', due_date: dateStr });
}

export async function deleteTodoSeries(seriesId) {
    return apiClient.post('/api/todo', { action: 'delete_series', series_id: seriesId });
}

