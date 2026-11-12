import { AsyncLocalStorage } from 'node:async_hooks';

// One database client per API request: the signed-in user's client (row-level security applies),
// or the privileged client for verified system callers (cron, Telegram webhook, share links, API key).
const storage = new AsyncLocalStorage();

export function runWithRequestContext(context, fn) {
    return storage.run(context, fn);
}

export function getRequestContext() {
    return storage.getStore() || null;
}

export function getDbClient() {
    const ctx = storage.getStore();
    if (!ctx || !ctx.db) throw new Error('Database is not available outside an API request.');
    return ctx.db;
}

export async function withPrivilegedDb(fn) {
    const ctx = storage.getStore() || {};
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    return storage.run({ ...ctx, db: supabaseAdmin, privileged: true }, fn);
}
