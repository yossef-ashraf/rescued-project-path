import { createClient } from '@supabase/supabase-js';
import { timingSafeEqualStr } from '@/features/auth/services/auth.js';

function publishableFetch(key) {
    return (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
    };
}

/**
 * Resolves the caller of an /api request.
 * - Lovable Cloud session (Bearer JWT): database client runs as that user, so row-level security applies.
 * - Workspace API key (x-api-key header, API_KEY secret): privileged client, as in the original app.
 * Returns { db, user, authUserId, status } where status is 'member' | 'pending' | 'anonymous'.
 */
export async function resolveRequestAuth(request) {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const authHeader = request.headers.get('authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    const expectedApiKey = (process.env['API_KEY'] || '').trim();
    const providedApiKey = (request.headers.get('x-api-key') || '').trim();
    if (expectedApiKey && providedApiKey && timingSafeEqualStr(providedApiKey, expectedApiKey)) {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        return { db: supabaseAdmin, status: 'member', user: { id: 0, username: 'service_api_key', role: 'service', isApiKey: true } };
    }

    const anonDb = createClient(url, key, {
        global: { fetch: publishableFetch(key) },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    if (!bearer || bearer.split('.').length !== 3) return { db: anonDb, status: 'anonymous', user: null };

    const db = createClient(url, key, {
        global: { fetch: publishableFetch(key), headers: { Authorization: `Bearer ${bearer}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData, error: claimsError } = await db.auth.getClaims(bearer);
    const sub = claimsData?.claims?.sub;
    if (claimsError || !sub) return { db: anonDb, status: 'anonymous', user: null };

    const [{ data: profile }, { data: roles }] = await Promise.all([
        db.from('profiles').select('id,name,email,username,status,avatar_url,phone,telegram_chat_id').eq('auth_user_id', sub).maybeSingle(),
        db.from('user_roles').select('role').eq('user_id', sub),
    ]);
    const roleList = (roles || []).map((r) => r.role);
    const role = roleList.includes('admin') ? 'admin' : roleList[0] || null;
    const email = claimsData.claims.email || profile?.email || null;
    const user = {
        id: profile ? String(profile.id) : null,
        auth_user_id: sub,
        name: profile?.name || email,
        email,
        username: profile?.username || email,
        role,
        status: profile?.status || 'active',
        avatar_url: profile?.avatar_url || null,
        phone: profile?.phone || null,
        telegram_chat_id: profile?.telegram_chat_id || null,
        accessToken: bearer,
    };
    const blocked = user.status === 'suspended' || user.status === 'inactive';
    return { db, user, authUserId: sub, status: role && !blocked ? 'member' : 'pending' };
}
