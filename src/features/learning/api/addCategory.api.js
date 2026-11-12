import { apiClient, toResponseEnvelope } from '@/shared/http/apiClient.js';


export async function fetchCourseCategories() {
    const data = await apiClient('/api/courses?parent_id=all').catch(() => []);
    const list = Array.isArray(data) ? data : (data?.rows || data?.data || []);
    return list.filter(i => i.type === 'category');
}

export async function createCategory(body) {
    return toResponseEnvelope(apiClient.post('/api/courses', body));
}

