import { apiClient, toResponseEnvelope } from '@/shared/http/apiClient.js';

export async function fetchCourseCategories() {
    const data = await apiClient('/api/courses?parent_id=all').catch(() => []);
    const list = Array.isArray(data) ? data : (data?.rows || data?.data || []);
    return list.filter(i => i.type === 'category');
}

export async function fetchCourseCategoriesAndMaterials() {
    const [catsData, materialsData] = await Promise.all([
        apiClient('/api/courses?parent_id=all').catch(() => []),
        apiClient('/api/courses?action=materials').catch(() => ({}))
    ]);
    const list = Array.isArray(catsData) ? catsData : (catsData?.rows || catsData?.data || []);
    const categories = list.filter(i => i.type === 'category');
    const allMaterials = materialsData?.files || [];
    return { categories, allMaterials };
}

export async function createCourse(body) {
    return toResponseEnvelope(apiClient.post('/api/courses', body));
}

