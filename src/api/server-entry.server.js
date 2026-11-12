import { handleApiRequest } from './index.js';
import { resolveRequestAuth } from './request-auth.server.js';
import { runWithRequestContext } from '@/shared/database/db-context.server.js';

const NO_STORE = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
};

function withHeaders(response) {
    try {
        for (const [k, v] of Object.entries(NO_STORE)) if (!response.headers.has(k)) response.headers.set(k, v);
        response.headers.set('X-Content-Type-Options', 'nosniff');
    } catch {
        // immutable headers (proxied responses) are fine as-is
    }
    return response;
}

function apiPath(request, prefix) {
    const path = new URL(request.url).pathname;
    return path.slice(prefix.length).replace(/^\/+|\/+$/g, '');
}

/** /api/* — signed-in workspace members (or the workspace API key). */
export async function handleAuthenticatedApi(request) {
    const auth = await resolveRequestAuth(request);
    const key = apiPath(request, '/api/');
    // Public-only callbacks live under /api/public/*.
    if (/^(public\/|telegram\/|cron\/telegram-webhook)/.test(key)) {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return runWithRequestContext({ ...auth, request }, async () =>
        withHeaders(await handleApiRequest(request, { params: { route: key.split('/') } })));
}

const PUBLIC_ROUTES = [
    { test: /^share\/resolve$/, key: () => 'public/share/resolve' },
    { test: /^share\/[^/]+$/, key: (k) => `public/${k}` },
    { test: /^telegram\/webhook$/, key: (k) => k },
    { test: /^video-stream$/, key: (k) => k },
    { test: /^cron\/(notifications|db-backup)$/, key: (k) => k, cron: true },
];

/**
 * /api/public/* — callers without a workspace session: share-link visitors, Telegram, scheduled jobs.
 * Each handler verifies its caller (share token, Telegram secret header, schedule credential).
 */
export async function handlePublicApi(request) {
    const sub = apiPath(request, '/api/public/');
    const match = PUBLIC_ROUTES.find((r) => r.test.test(sub));
    if (!match) return Response.json({ error: 'Not found' }, { status: 404 });

    let verifiedSystemCaller = false;
    if (match.cron) {
        verifiedSystemCaller = await verifyScheduledCaller(request);
        if (!verifiedSystemCaller) return new Response('Unauthorized', { status: 401 });
    }

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const key = match.key(sub);
    return runWithRequestContext({ db: supabaseAdmin, user: null, status: 'system', privileged: true, verifiedSystemCaller, request }, async () =>
        withHeaders(await handleApiRequest(request, { params: { route: key.split('/') } })));
}

async function verifyScheduledCaller(request) {
    const { authenticateCronRequest } = await import('@/integrations/supabase/cron-auth');
    const failure = await authenticateCronRequest(request);
    if (!failure) return true;
    // Optional: external schedulers can use the CRON_SECRET secret (x-cron-secret header).
    const secret = (process.env['CRON_SECRET'] || '').trim();
    const provided = (request.headers.get('x-cron-secret') || '').trim();
    if (secret && provided && secret.length === provided.length) {
        const { timingSafeEqual } = await import('node:crypto');
        return timingSafeEqual(Buffer.from(secret), Buffer.from(provided));
    }
    return false;
}
