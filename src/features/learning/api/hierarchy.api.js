import { apiClient, toResponseEnvelope } from '@/shared/http/apiClient.js';


export async function fetchCourseHierarchy() {
    const data = await apiClient('/api/courses?parent_id=all').catch(() => []);
    return Array.isArray(data) ? data : (data?.rows || data?.data || []);
}

export async function createHierarchyItem(payload) {
    return toResponseEnvelope(apiClient.post('/api/courses', payload));
}

export async function updateHierarchyItem(body) {
    return toResponseEnvelope(apiClient.post('/api/courses', body));
}

export async function moveHierarchyParent(id, parentId) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'move_parent',
        id,
        parent_id: parentId
    }));
}

export async function deleteHierarchyItem(id) {
    return toResponseEnvelope(apiClient.delete(`/api/courses?id=${id}`));
}

export async function reorderHierarchyItems(orderedIds) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'reorder_hierarchy',
        ordered_ids: orderedIds
    }));
}

