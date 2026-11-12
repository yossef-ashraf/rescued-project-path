import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchProjects() {
    const data = await apiClient('/api/projects').catch(() => []);
    return Array.isArray(data) ? data : (data?.data || []);
}

export async function createProject(payload) {
    return apiClient('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function updateProject(payload) {
    return apiClient('/api/projects', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export async function addProjectComment(projectId, text) {
    return apiClient('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
            action: 'add_comment',
            id: projectId,
            text
        })
    });
}

export async function deleteProject(id) {
    return apiClient(`/api/projects?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}
