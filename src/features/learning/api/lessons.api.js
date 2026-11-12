import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchAllLessons(params = {}) {
    const qs = new URLSearchParams();
    if (params.courseId) qs.set('courseId', params.courseId);
    if (params.search) qs.set('search', params.search);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient(`/api/learning/lessons${query}`);
}

/**
 * Lessons Client API (Section 5 & 9 — Master Plan)
 */

export async function fetchCourse(courseId) {
    return apiClient(`/api/courses?id=${courseId}`);
}

export async function fetchCourseLessons(courseId) {
    return apiClient(`/api/learning/courses/${courseId}/lessons`);
}

export async function fetchCourseAttachments(courseId) {
    return apiClient(`/api/learning/courses/${courseId}/attachments`);
}

export async function createLesson(courseId, payload) {
    return apiClient(`/api/learning/courses/${courseId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function fetchLesson(lessonId) {
    return apiClient(`/api/learning/lessons/${lessonId}`);
}

export async function updateLesson(lessonId, payload) {
    return apiClient(`/api/learning/lessons/${lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
}

export async function deleteLesson(lessonId) {
    return apiClient(`/api/learning/lessons/${lessonId}`, {
        method: 'DELETE'
    });
}

export async function fetchLessonAttachments(lessonId) {
    return apiClient(`/api/learning/lessons/${lessonId}/attachments`);
}

export async function addLessonAttachment(lessonId, payload) {
    return apiClient(`/api/learning/lessons/${lessonId}/attachments`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function deleteLessonAttachment(attachmentId) {
    return apiClient(`/api/learning/attachments/${attachmentId}`, {
        method: 'DELETE'
    });
}

export async function fetchLessonResources(lessonId) {
    return apiClient(`/api/learning/lessons/${lessonId}/resources`);
}

export async function addLessonResource(lessonId, payload) {
    return apiClient(`/api/learning/lessons/${lessonId}/resources`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function deleteLessonResource(resourceId) {
    return apiClient(`/api/learning/resources/${resourceId}`, {
        method: 'DELETE'
    });
}

const serviceExports = {
    fetchAllLessons,
    fetchCourseLessons,
    createLesson,
    fetchLesson,
    updateLesson,
    deleteLesson,
    fetchLessonAttachments,
    addLessonAttachment,
    deleteLessonAttachment,
    fetchLessonResources,
    addLessonResource,
    deleteLessonResource
};

export default serviceExports;
