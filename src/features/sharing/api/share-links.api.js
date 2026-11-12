import { apiClient } from '@/shared/http/apiClient.js';

/**
 * Client API for Share Links (Section 30)
 */

export async function createShareLink(payload) {
    return apiClient('/api/share-links', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function listShareLinks() {
    return apiClient('/api/share-links');
}

export async function revokeShareLink(id) {
    return apiClient(`/api/share-links/${id}/revoke`, {
        method: 'POST'
    });
}

export async function renewShareLink(id, duration = '1h') {
    return apiClient(`/api/share-links/${id}/renew`, {
        method: 'POST',
        body: JSON.stringify({ duration })
    });
}

export async function fetchPublicShare(token) {
    const res = await fetch(`/api/public/share/${encodeURIComponent(token)}`, {
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر تحميل الرابط المشترك أو انتهت صلاحيته');
    }
    return res.json();
}

const serviceExports = {
    createShareLink,
    listShareLinks,
    revokeShareLink,
    renewShareLink,
    fetchPublicShare
};

export default serviceExports;
