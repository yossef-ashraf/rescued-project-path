import { apiClient } from '@/shared/http/apiClient.js';

export async function fetchAuthLogs(params) {
    return apiClient(`/api/auth/logs?${params.toString()}`);
}

