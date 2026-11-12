import {
  createSharedLink,
  listSharedLinks,
  revokeSharedLink,
  renewSharedLink,
  resolveSharedLink,
  purgeExpiredSharedLinks
} from '@/features/sharing/services/sharingService.js';
import { successResponse, badRequest, notFound } from '@/shared/api/response';
import { getAuthenticatedUser } from '@/features/auth/services/auth.js';

export const shareRoutes = {
  // Master Plan Section 30 routes
  'share-links': {
    GET: async (req) => {
      try {
        const user = await getAuthenticatedUser(req);
        const links = await listSharedLinks(user?.id || null);
        return successResponse(links);
      } catch (err) {
        console.error('[API Share-Links List] Error:', err);
        return badRequest(err.message || 'Failed to list share links');
      }
    },
    POST: async (req) => {
      try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const { entityType, scopeType, entityId, scopeId, duration, expiresInHours, permissions, metadata } = body;

        const resolvedType = scopeType || entityType;
        const resolvedId = scopeId || entityId;

        if (!resolvedType) {
          return badRequest('نوع العنصر المراد مشاركته مطلوب (scopeType)');
        }

        const link = await createSharedLink({
          entityType: resolvedType,
          entityId: resolvedId || 0,
          userId: user?.id || null,
          duration: duration || '1h',
          expiresInHours,
          permissions: permissions || 'read_only',
          metadata
        });

        return successResponse(link, 201);
      } catch (err) {
        console.error('[API Share-Links Create] Error:', err);
        return badRequest(err.message || 'Failed to create share link');
      }
    }
  },

  'share-links/:id/revoke': {
    POST: async (req, ctx) => {
      try {
        const user = await getAuthenticatedUser(req);
        const id = ctx?.matchedParams?.id;
        if (!id) return badRequest('معرف الرابط مطلوب');

        const revoked = await revokeSharedLink(id, user?.id || null);
        return successResponse({ success: Boolean(revoked), id });
      } catch (err) {
        console.error('[API Share-Links Revoke] Error:', err);
        return badRequest(err.message || 'Failed to revoke share link');
      }
    }
  },

  'share-links/:id/renew': {
    POST: async (req, ctx) => {
      try {
        const user = await getAuthenticatedUser(req);
        const id = ctx?.matchedParams?.id;
        if (!id) return badRequest('معرف الرابط مطلوب');

        const body = await req.json().catch(() => ({}));
        const duration = body?.duration || '1h';

        const renewed = await renewSharedLink(id, duration, user?.id || null);
        return successResponse({ success: Boolean(renewed), id });
      } catch (err) {
        console.error('[API Share-Links Renew] Error:', err);
        return badRequest(err.message || 'Failed to renew share link');
      }
    }
  },

  'share-links/purge': {
    POST: async () => {
      try {
        const purged = await purgeExpiredSharedLinks();
        return successResponse({ purged });
      } catch (err) {
        console.error('[API Share-Links Purge] Error:', err);
        return badRequest(err.message || 'Failed to purge expired links');
      }
    }
  },

  'public/share/:token': {
    GET: async (req, ctx) => {
      try {
        const token = ctx?.matchedParams?.token;
        if (!token) return badRequest('رمز الرابط مطلوب');

        const ip = req.headers?.get('x-forwarded-for') || '';
        const userAgent = req.headers?.get('user-agent') || '';
        const referer = req.headers?.get('referer') || '';

        const result = await resolveSharedLink(token, { ip, userAgent, referer });
        if (!result.valid) {
          return new Response(JSON.stringify({ error: result.reason }), {
            status: result.code || 404,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'private, no-store',
              'X-Robots-Tag': 'noindex, nofollow, noarchive'
            }
          });
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-store',
            'X-Robots-Tag': 'noindex, nofollow, noarchive',
            'Referrer-Policy': 'no-referrer',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      } catch (err) {
        console.error('[API Public Share] Error:', err);
        return badRequest(err.message || 'Failed to resolve public share link');
      }
    }
  },

  'share/resolve': {
    GET: async (req) => {
      try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');
        if (!token) return badRequest('رمز المشاركة مطلوب');

        const ip = req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip') || '';
        const userAgent = req.headers?.get('user-agent') || '';
        const result = await resolveSharedLink(token, { ip, userAgent });

        if (!result.valid) {
          return new Response(JSON.stringify({
            success: false,
            error: { message: result.reason || 'الرابط غير صالح' },
            code: result.code || 404
          }), {
            status: result.code || 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return successResponse(result);
      } catch (err) {
        console.error('[API Share Resolve] Error:', err);
        return badRequest(err.message || 'Failed to resolve share link');
      }
    }
  },

  'share/:token': {
    DELETE: async (req, ctx) => {
      try {
        const user = await getAuthenticatedUser(req);
        const token = ctx?.matchedParams?.token;
        if (!token) return badRequest('رمز الرابط مطلوب');
        const revoked = await revokeSharedLink(token, user?.id || null);
        return successResponse({ success: Boolean(revoked), token });
      } catch (err) {
        console.error('[API Share Token Delete] Error:', err);
        return badRequest(err.message || 'Failed to revoke share link');
      }
    },
    GET: async (req, ctx) => {
      try {
        const token = ctx?.matchedParams?.token;
        if (!token) return badRequest('رمز الرابط مطلوب');
        const ip = req.headers?.get('x-forwarded-for') || '';
        const userAgent = req.headers?.get('user-agent') || '';
        const result = await resolveSharedLink(token, { ip, userAgent });
        if (!result.valid) {
          return new Response(JSON.stringify({
            success: false,
            error: { message: result.reason || 'الرابط غير صالح' },
            code: result.code || 404
          }), {
            status: result.code || 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return successResponse(result);
      } catch (err) {
        console.error('[API Share Token GET] Error:', err);
        return badRequest(err.message || 'Failed to resolve share link');
      }
    }
  },

  // Legacy route compatibility
  'share': {
    GET: async (req) => {
      try {
        const user = await getAuthenticatedUser(req);
        const links = await listSharedLinks(user?.id || null);
        return successResponse(links);
      } catch (err) {
        console.error('[API Share List] Error:', err);
        return badRequest(err.message || 'Failed to list share links');
      }
    },
    POST: async (req) => {
      try {
        const user = await getAuthenticatedUser(req);
        const body = await req.json().catch(() => ({}));
        const { entityType, entityId, duration, expiresInHours, permissions, metadata } = body;

        if (!entityType) {
          return badRequest('نوع العنصر المراد مشاركته مطلوب (entityType)');
        }

        const link = await createSharedLink({
          entityType,
          entityId: entityId || 0,
          userId: user?.id || null,
          duration: duration || '1h',
          expiresInHours,
          permissions: permissions || 'read_only',
          metadata
        });

        return successResponse(link, 201);
      } catch (err) {
        console.error('[API Share Create] Error:', err);
        return badRequest(err.message || 'Failed to create share link');
      }
    },
    DELETE: async (req) => {
      try {
        const user = await getAuthenticatedUser(req);
        const { searchParams } = new URL(req.url);
        let token = searchParams.get('token');

        if (!token) {
          const body = await req.json().catch(() => ({}));
          token = body.token;
        }

        if (!token) {
          return badRequest('رمز الرابط (token) مطلوب للإلغاء');
        }

        const revoked = await revokeSharedLink(token, user?.id || null);
        return successResponse({ revoked });
      } catch (err) {
        console.error('[API Share Delete] Error:', err);
        return badRequest(err.message || 'Failed to revoke share link');
      }
    }
  }
};

export default shareRoutes;
