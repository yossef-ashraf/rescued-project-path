// Sign-in is handled by Lovable Cloud authentication. The API resolves the caller once per request
// (see src/api/request-auth.server.js); these helpers expose that result to the original controllers.
import crypto from 'crypto';
import { AuthLog } from '../../../shared/models/index.js';
import { getRequestContext } from '../../../shared/database/db-context.server.js';

export function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const forwarded = req.headers?.get?.('cf-connecting-ip') || req.headers?.get?.('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = req.headers?.get?.('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
}

export function getUserAgent(req) {
    if (!req) return 'Unknown';
    return (req.headers?.get?.('user-agent') || 'Unknown').slice(0, 255);
}

export async function recordAuthLog({ userId = null, username = null, action, status, ip = '127.0.0.1', userAgent = 'Unknown', details = null }) {
    try {
        await AuthLog.create({
            user_id: userId && /^\d+$/.test(String(userId)) ? userId : null,
            username,
            action,
            status,
            ip_address: ip,
            user_agent: String(userAgent || 'Unknown').slice(0, 255),
            details: details ? (typeof details === 'object' ? details : { info: String(details) }) : null,
            created_at: new Date()
        });
    } catch (err) {
        console.error('Failed to write auth log:', err.message);
    }
}

export function invalidateUserAuthCache() {}

/** The signed-in workspace member for this request, or null. */
export async function getAuthenticatedUser() {
    const ctx = getRequestContext();
    const user = ctx?.user;
    if (!user || user.isApiKey || !user.role) return null;
    return user;
}

/** True when the request was authenticated with the workspace API key. */
export function validateApiKey() {
    const ctx = getRequestContext();
    return Boolean(ctx?.user?.isApiKey);
}

export function timingSafeEqualStr(a, b) {
    const ab = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}
