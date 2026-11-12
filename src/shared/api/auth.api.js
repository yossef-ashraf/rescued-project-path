import { apiClient } from '@/shared/http/apiClient.js';

export async function checkAuthSession() {
    return apiClient('/api/auth/me').catch(() => null);
}

export async function sendOtp(destination, channel) {
    try {
        const data = await apiClient.post('/api/auth/send-otp', { destination, channel });
        return { ok: true, data };
    } catch (err) {
        return { ok: false, data: { error: err.message, ...(err.details || {}) } };
    }
}

export async function verifyOtp(payload) {
    try {
        const data = await apiClient.post('/api/auth/login', payload);
        return { ok: true, data };
    } catch (err) {
        return { ok: false, data: { error: err.message, ...(err.details || {}) } };
    }
}

