import { apiClient, toResponseEnvelope } from '@/shared/http/apiClient.js';


export async function fetchMaterialsData(type = null) {
    const url = type ? `/api/courses?action=materials&item_type=${encodeURIComponent(type)}` : '/api/courses?action=materials';
    const data = await apiClient(url).catch(() => null);
    return {
        files: data?.files || data?.data?.files || [],
        categories: data?.categories || data?.data?.categories || [],
        courses: data?.courses || data?.data?.courses || []
    };
}

export async function addMaterialCategory(name, color = '#10B981') {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'add_material_category',
        name: name.trim(),
        color
    }));
}

export async function addMaterialFile(payload) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'add_file',
        ...payload
    }));
}

export async function updateMaterialFile(payload) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'update_file',
        ...payload
    }));
}

export async function updateReadingStatus(id, reading_status, notes) {
    const body = {
        action: 'update_reading_status',
        id,
        reading_status
    };
    if (notes !== undefined) {
        body.notes = notes;
    }
    return toResponseEnvelope(apiClient.post('/api/courses', body));
}

export async function deleteMaterialFile(file_id) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'delete_file',
        file_id
    }));
}

export async function linkMaterialToCourse(file_id, course_id) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'link_material',
        file_id,
        course_id: course_id ? parseInt(course_id, 10) : null
    }));
}

export async function changeItemType(file_id, item_type) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'change_item_type',
        file_id,
        item_type
    }));
}

export async function bulkTransferLetterFiles({ fileIds, categoryName, itemType, categoryColor }) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'bulk_transfer_category',
        file_ids: fileIds,
        category_name: categoryName,
        item_type: itemType,
        category_color: categoryColor
    }));
}

export async function transferMaterialToLesson(file_id, lesson_id) {
    return toResponseEnvelope(apiClient.post('/api/courses', {
        action: 'transfer_to_lesson',
        file_id,
        lesson_id: parseInt(lesson_id, 10)
    }));
}

export async function fetchMaterialDetails(materialId) {
    const res = await apiClient(`/api/courses?action=material_detail&id=${encodeURIComponent(materialId)}`).catch(() => null);
    return res?.data || res;
}




