import crypto from 'crypto';
import SharedLinkView from '../../../shared/models/SharedLinkView.js';

/**
 * Service: Share Access Auditor & Rate Limiter
 * Section 30 — Master Plan
 */

export async function logShareAccess(linkId, { ip = '', userAgent = '', referer = '', result = 'success' } = {}) {
    try {
        const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32) : null;
        const uaHash = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 32) : null;
        const refHash = referer ? crypto.createHash('sha256').update(referer).digest('hex').slice(0, 32) : null;

        await SharedLinkView.create({
            link_id: linkId,
            ip_hash: ipHash,
            user_agent: uaHash,
            referer_hash: refHash,
            result
        });
    } catch (err) {
        // Access logging is non-blocking
        console.warn('[ShareAccessLog] Warning:', err.message);
    }
}

export function validateLinkActive(link) {
    if (!link) {
        return { valid: false, code: 404, reason: 'رابط المشاركة غير موجود أو غير صحيح' };
    }
    if (link.is_revoked) {
        return { valid: false, code: 410, reason: 'تم إلغاء هذا الرابط بواسطة المالك' };
    }
    if (new Date(link.expires_at) <= new Date()) {
        return { valid: false, code: 410, reason: 'انتهت صلاحية هذا الرابط المؤقت' };
    }
    return { valid: true };
}

const serviceExports = {
    logShareAccess,
    validateLinkActive
};

export default serviceExports;
