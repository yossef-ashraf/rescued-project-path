import crypto from 'crypto';
import { Op } from '@/shared/database/orm.js';
import SharedLink from '../../../shared/models/SharedLink.js';
import SharedLinkView from '../../../shared/models/SharedLinkView.js';
import { generateOpaqueToken, hashToken } from './share-token.service.js';
import { resolveScopeEntity } from './share-scope.service.js';
import { logShareAccess, validateLinkActive } from './share-access.service.js';

/**
 * Public Temporary Sharing Service
 * Section 30 — Orbit Architecture v2 Master Plan
 * With Automatic Expired Link Database Purging
 */

/**
 * Permanently purge expired or revoked shared links from the database
 * Requirement: "عاوز اللينكس بعد ما وقتها تخلص تتمسح"
 */
export async function purgeExpiredSharedLinks() {
    try {
        const now = new Date();
        const expiredLinks = await SharedLink.findAll({
            where: {
                [Op.or]: [
                    { expires_at: { [Op.lt]: now } },
                    { is_revoked: true }
                ]
            },
            attributes: ['id']
        });

        if (!expiredLinks || expiredLinks.length === 0) {
            return 0;
        }

        const ids = expiredLinks.map(l => l.id);

        // Delete associated access logs first to respect foreign keys
        await SharedLinkView.destroy({
            where: { link_id: { [Op.in]: ids } }
        }).catch(() => {});

        // Permanently destroy expired link records from setting_shared_links
        const deletedCount = await SharedLink.destroy({
            where: { id: { [Op.in]: ids } }
        });

        return deletedCount;
    } catch (err) {
        console.error('[Sharing] Failed to purge expired links:', err);
        return 0;
    }
}

export async function createSharedLink({
    entityType = 'page',
    entityId = 0,
    userId = null,
    duration = '1h',
    expiresInHours = null,
    permissions = 'read_only',
    scopeSelector = null,
    metadata = {}
}) {
    if (!entityType) {
        throw new Error('entityType (scope) is required');
    }

    // Trigger background auto-purge of old expired links
    purgeExpiredSharedLinks().catch(() => {});

    let durationMs = 60 * 60 * 1000; // default 1 hour
    if (expiresInHours) {
        durationMs = Number(expiresInHours) * 60 * 60 * 1000;
    } else if (typeof duration === 'string') {
        const num = parseInt(duration, 10);
        if (!isNaN(num) && num > 0) {
            if (duration.endsWith('m')) durationMs = num * 60 * 1000;
            else if (duration.endsWith('h')) durationMs = num * 60 * 60 * 1000;
            else if (duration.endsWith('d')) durationMs = num * 24 * 60 * 60 * 1000;
        }
    }

    // 32 random bytes entropy
    const rawToken = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + durationMs);

    const link = await SharedLink.create({
        token: rawToken,
        entity_type: entityType,
        entity_id: Number(entityId) || 0,
        created_by: userId,
        expires_at: expiresAt,
        permissions,
        is_revoked: false,
        metadata: metadata || {}
    });

    return {
        id: Number(link.id),
        token: rawToken,
        shareUrl: `/share/s/${rawToken}`,
        expiresAt: link.expires_at,
        permissions: link.permissions,
        entityType: link.entity_type,
        entityId: Number(link.entity_id)
    };
}

export async function listSharedLinks(userId = null) {
    // Purge expired links before listing so list never contains dead links in DB
    await purgeExpiredSharedLinks().catch(() => {});

    const where = { is_revoked: false };
    if (userId) where.created_by = userId;

    const links = await SharedLink.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: 50
    });

    return links.map(link => {
        const isExpired = new Date(link.expires_at) < new Date();
        return {
            id: Number(link.id),
            token: link.token,
            entityType: link.entity_type,
            entityId: Number(link.entity_id),
            expiresAt: link.expires_at,
            createdAt: link.created_at,
            viewCount: Number(link.view_count) || 0,
            isExpired,
            shareUrl: `/share/s/${link.token}`
        };
    });
}

export async function revokeSharedLink(tokenOrId, userId = null) {
    const isId = !isNaN(Number(tokenOrId)) && String(Number(tokenOrId)) === String(tokenOrId).trim();
    const where = isId ? { id: Number(tokenOrId) } : { token: tokenOrId };
    if (userId) where.created_by = userId;

    const link = await SharedLink.findOne({ where });
    if (!link) return false;

    // Remove child views then permanently destroy link from database
    await SharedLinkView.destroy({ where: { link_id: link.id } }).catch(() => {});
    const deleted = await link.destroy();

    return Boolean(deleted);
}

export async function renewSharedLink(tokenOrId, duration = '1h', userId = null) {
    const isId = !isNaN(Number(tokenOrId)) && String(Number(tokenOrId)) === String(tokenOrId).trim();
    const where = isId ? { id: Number(tokenOrId) } : { token: tokenOrId };
    if (userId) where.created_by = userId;

    let durationMs = 60 * 60 * 1000;
    const num = parseInt(duration, 10);
    if (!isNaN(num) && num > 0) {
        if (duration.endsWith('m')) durationMs = num * 60 * 1000;
        else if (duration.endsWith('h')) durationMs = num * 60 * 60 * 1000;
        else if (duration.endsWith('d')) durationMs = num * 24 * 60 * 60 * 1000;
    }

    const expiresAt = new Date(Date.now() + durationMs);
    const [updated] = await SharedLink.update(
        { expires_at: expiresAt, is_revoked: false },
        { where }
    );

    return updated > 0;
}

export async function resolveSharedLink(token, { ip = '', userAgent = '', referer = '' } = {}) {
    if (!token) {
        return { valid: false, code: 400, reason: 'رمز المشاركة مطلوب' };
    }

    // Trigger background purge of any other expired links
    purgeExpiredSharedLinks().catch(() => {});

    const link = await SharedLink.findOne({
        where: { token }
    });

    if (!link) {
        return {
            valid: false,
            code: 404,
            reason: 'رابط المشاركة غير موجود أو انتهت صلاحيته وتم حذفه نهائياً من قاعدة البيانات.'
        };
    }

    // Check if expired or revoked
    const isExpired = new Date(link.expires_at) <= new Date();
    if (isExpired || link.is_revoked) {
        // PERMANENTLY DELETE EXPIRED LINK IMMEDIATELY!
        await SharedLinkView.destroy({ where: { link_id: link.id } }).catch(() => {});
        await link.destroy().catch(() => {});

        return {
            valid: false,
            code: 410,
            reason: 'انتهت صلاحية هذا الرابط المؤقت وتم حذفه نهائياً من قاعدة البيانات لحماية الخصوصية.'
        };
    }

    // Increment access count & log view
    await link.increment('view_count');
    await logShareAccess(link.id, { ip, userAgent, referer, result: 'success' });

    // Resolve scoped entity data
    const entityData = await resolveScopeEntity(link.entity_type, link.entity_id, link.metadata);

    return {
        valid: true,
        entityType: link.entity_type,
        expiresAt: link.expires_at,
        permissions: link.permissions,
        data: entityData
    };
}

const serviceExports = {
    createSharedLink,
    listSharedLinks,
    revokeSharedLink,
    renewSharedLink,
    resolveSharedLink,
    purgeExpiredSharedLinks
};

export default serviceExports;
