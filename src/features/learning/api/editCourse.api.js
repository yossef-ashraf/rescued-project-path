import { apiClient, toResponseEnvelope } from '@/shared/http/apiClient.js';


export async function fetchCourseAndCategories(id) {
    const [catsData, courseData, materialsData] = await Promise.all([
        apiClient('/api/courses?parent_id=all').catch(() => []),
        apiClient(`/api/courses?id=${id}`).catch(() => null),
        apiClient('/api/courses?action=materials').catch(() => ({}))
    ]);

    const list = Array.isArray(catsData) ? catsData : (catsData?.rows || catsData?.data || []);
    const cats = list.filter(i => i.type === 'category' && String(i.id) !== String(id));
    const currentItem = courseData || list.find(i => String(i.id) === String(id));
    const allMaterials = materialsData?.files || [];

    return {
        categories: cats,
        currentItem,
        linkedMaterials: courseData?.files || [],
        allMaterials
    };
}

export async function updateCourseOrCategory(body) {
    return toResponseEnvelope(apiClient.post('/api/courses', body));
}

export async function linkMaterialToCourse(fileId, courseId) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'link_material',
        file_id: fileId,
        course_id: courseId ? parseInt(courseId, 10) : null
    }));
}

