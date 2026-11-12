import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchCourseStats() {
    return apiClient('/api/courses?action=stats');
}

export async function fetchAllCourses() {
    const data = await apiClient('/api/courses?parent_id=all').catch(() => []);
    return Array.isArray(data) ? data : (data?.data || data?.rows || []);
}

export async function updateCourseProgress(id, completedUnits, totalUnits) {
    return apiClient.post('/api/courses', {
        action: 'update_progress',
        id,
        completed_units: completedUnits,
        total_units: totalUnits
    });
}

