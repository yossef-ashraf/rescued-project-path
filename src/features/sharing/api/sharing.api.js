import { apiClient } from '@/shared/http/apiClient.js';

export async function createSharedLink(payload) {
    return apiClient('/api/share', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function listSharedLinks() {
    return apiClient('/api/share');
}

export async function revokeSharedLink(token) {
    return apiClient(`/api/share/${token}`, {
        method: 'DELETE'
    });
}

export async function resolveSharedLink(token, passphrase) {
    const url = passphrase ? `/api/public/share/resolve?token=${encodeURIComponent(token)}&passphrase=${encodeURIComponent(passphrase)}` : `/api/public/share/resolve?token=${encodeURIComponent(token)}`;
    return apiClient(url);
}
