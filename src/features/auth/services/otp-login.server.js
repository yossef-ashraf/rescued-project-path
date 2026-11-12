// One-time-code sign-in (the original Orbit login: username or email, then a 6-digit code).
// Codes are delivered by email (Lovable Cloud auth) or by the workspace Telegram bot; a verified
// code is exchanged for a normal Lovable Cloud session, so the rest of the app is unchanged.
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getDbClient, withPrivilegedDb } from '@/shared/database/db-context.server.js';
import { getTelegramConfig } from '@/features/settings/services/telegram-integration.js';
import { recordAuthLog } from '@/features/auth/services/auth.js';

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Preview-only sign-in. `import.meta.env.DEV` is false in the published build, so this account
// and code are compiled out of the live site and only work in the editor preview.
export const PREVIEW_LOGIN = { username: 'yossef', code: '000000', email: 'yossef@orbit.local' };
export function isPreviewLogin(login) {
    return Boolean(import.meta.env.DEV) && String(login || '').trim().toLowerCase() === PREVIEW_LOGIN.username;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publishableClient() {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    return createClient(url, key, {
        global: {
            fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
                headers.set('apikey', key);
                return fetch(input, { ...init, headers });
            },
        },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
}

export function maskEmail(email) {
    const [user, domain] = String(email).split('@');
    if (!domain) return '';
    return `${user.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(6, user.length - 2)))}@${domain}`;
}

const hash = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

async function findProfile(login) {
    const db = getDbClient();
    const value = login.trim().toLowerCase();
    const column = EMAIL_RE.test(value) ? 'email' : 'username';
    const { data } = await db.from('profiles')
        .select('id, name, email, username, status, auth_user_id, telegram_chat_id')
        .ilike(column, value).order('id').limit(1).maybeSingle();
    return data || null;
}

async function recentFailures(login) {
    const db = getDbClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await db.from('setting_auth_logs').select('id', { count: 'exact', head: true })
        .eq('action', 'OTP_LOGIN_FAILED').ilike('username', login).gte('created_at', since);
    return count || 0;
}

async function recentSends(destination) {
    const db = getDbClient();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await db.from('setting_auth_otps').select('id', { count: 'exact', head: true })
        .eq('destination', destination).gte('created_at', since);
    return count || 0;
}

/** Exchanges a verified identity for a Lovable Cloud session (no email is sent). */
async function sessionForEmail(email, { create = false } = {}) {
    const admin = getDbClient().auth.admin;
    let link = await admin.generateLink({ type: 'magiclink', email });
    if (link.error && create) {
        const createdUser = await admin.createUser({ email, email_confirm: true });
        if (createdUser.error) throw createdUser.error;
        link = await admin.generateLink({ type: 'magiclink', email });
    }
    if (link.error) throw link.error;
    const props = link.data.properties || {};
    const client = publishableClient();
    let { data, error } = await client.auth.verifyOtp({ token_hash: props.hashed_token, type: props.verification_type || 'magiclink' });
    if ((error || !data?.session) && props.email_otp) {
        ({ data, error } = await client.auth.verifyOtp({ email, token: props.email_otp, type: 'email' }));
    }
    if (error || !data?.session) throw error || new Error('Could not start a session.');
    return { session: data.session, authUserId: data.user?.id };
}

function sessionPayload(session) {
    return { access_token: session.access_token, refresh_token: session.refresh_token };
}

async function ensurePreviewAdmin(authUserId) {
    const db = getDbClient();
    const { data: roles } = await db.from('user_roles').select('role').eq('user_id', authUserId);
    if (!(roles || []).some((r) => r.role === 'admin')) {
        await db.from('user_roles').insert({ user_id: authUserId, role: 'admin' });
    }
}

/**
 * Step 1: send a code. Returns { ok, status?, error?, data? }.
 * channel: 'email' | 'telegram'
 */
export async function sendLoginCode({ login, channel, origin, ip, userAgent }) {
    const value = String(login || '').trim().toLowerCase();
    if (!value) return { ok: false, status: 400, error: 'Enter your username or email.' };

    if (isPreviewLogin(value)) {
        return { ok: true, data: { channel, preview: true, targetDestination: value, maskedDestination: 'Preview', message: 'Preview sign-in — enter 000000.' } };
    }

    return withPrivilegedDb(async () => {
        if ((await recentFailures(value)) >= MAX_ATTEMPTS) {
            return { ok: false, status: 429, error: 'Too many attempts. Please wait 15 minutes and try again.' };
        }
        const profile = await findProfile(value);
        if (profile && (profile.status === 'suspended' || profile.status === 'inactive')) {
            return { ok: false, status: 403, error: 'This account is disabled. Ask an admin to reactivate it.' };
        }

        if (channel === 'email') {
            const email = profile?.email || (EMAIL_RE.test(value) ? value : null);
            if (!email) return { ok: false, status: 404, error: 'No account uses this username. Try your email instead.' };
            const { error } = await publishableClient().auth.signInWithOtp({
                email,
                options: { shouldCreateUser: true, emailRedirectTo: `${origin}/login` },
            });
            if (error) {
                const rate = /rate|seconds|security purposes/i.test(error.message);
                return { ok: false, status: rate ? 429 : 400, error: rate ? 'Please wait a minute before requesting another code.' : error.message };
            }
            await recordAuthLog({ userId: profile?.id, username: profile?.username || value, action: 'OTP_SENT', status: 'SUCCESS', ip, userAgent, details: { channel } });
            return { ok: true, data: { channel, targetDestination: value, maskedDestination: maskEmail(email), message: 'We emailed you a sign-in code.' } };
        }

        if (!profile) return { ok: false, status: 404, error: 'No account found for this username or email.' };
        if ((await recentSends(profile.username)) >= MAX_ATTEMPTS) {
            return { ok: false, status: 429, error: 'Too many codes requested. Please wait 15 minutes.' };
        }
        const { token, chatId } = await getTelegramConfig(true);
        const targetChat = profile.telegram_chat_id || chatId;
        if (!token || !targetChat) {
            return { ok: false, status: 409, error: 'The Telegram bot is not connected yet. Use email instead.' };
        }
        const code = String(globalThis.crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
        await getDbClient().from('setting_auth_otps').insert({
            destination: profile.username, code: hash(code), verified: 0,
            expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString(), created_at: new Date().toISOString(),
        });
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: targetChat, parse_mode: 'HTML', text: `🔐 <b>Orbit sign-in code</b>\n\n<code>${code}</code>\n\nValid for ${CODE_TTL_MINUTES} minutes. Don't share it.` }),
        }).then((r) => r.json()).catch((e) => ({ ok: false, description: e.message }));
        if (!res.ok) return { ok: false, status: 502, error: 'Telegram did not accept the message. Try email instead.' };
        await recordAuthLog({ userId: profile.id, username: profile.username, action: 'OTP_SENT', status: 'SUCCESS', ip, userAgent, details: { channel } });
        return { ok: true, data: { channel, targetDestination: value, maskedDestination: 'Telegram', message: 'We sent a code to your Telegram.' } };
    });
}

/** Step 2: verify the code and return a session { access_token, refresh_token }. */
export async function verifyLoginCode({ login, code, channel, ip, userAgent }) {
    const value = String(login || '').trim().toLowerCase();
    const otp = String(code || '').replace(/\D/g, '');
    if (!value || !otp) return { ok: false, status: 400, error: 'Enter the code we sent you.' };

    return withPrivilegedDb(async () => {
        if (isPreviewLogin(value)) {
            if (otp !== PREVIEW_LOGIN.code) return { ok: false, status: 401, error: 'Incorrect code.' };
            const profile = await findProfile(value);
            let email = PREVIEW_LOGIN.email;
            if (profile?.auth_user_id) {
                const { data } = await getDbClient().auth.admin.getUserById(profile.auth_user_id);
                email = data?.user?.email || profile.email || email;
            }
            const { session, authUserId } = await sessionForEmail(email, { create: true });
            await ensurePreviewAdmin(authUserId);
            return { ok: true, data: { session: sessionPayload(session) } };
        }

        if ((await recentFailures(value)) >= MAX_ATTEMPTS) {
            return { ok: false, status: 429, error: 'Too many attempts. Please wait 15 minutes and try again.' };
        }
        const profile = await findProfile(value);
        const fail = async () => {
            await recordAuthLog({ userId: profile?.id, username: value, action: 'OTP_LOGIN_FAILED', status: 'FAILED', ip, userAgent, details: { channel } });
            return { ok: false, status: 401, error: 'Incorrect or expired code.' };
        };

        let session;
        if (channel === 'email') {
            const email = profile?.email || (EMAIL_RE.test(value) ? value : null);
            if (!email) return fail();
            const { data, error } = await publishableClient().auth.verifyOtp({ email, token: otp, type: 'email' });
            if (error || !data?.session) return fail();
            session = data.session;
        } else {
            if (!profile?.email) return fail();
            const db = getDbClient();
            const { data: row } = await db.from('setting_auth_otps').select('id')
                .eq('destination', profile.username).eq('code', hash(otp)).eq('verified', 0)
                .gt('expires_at', new Date().toISOString()).order('id', { ascending: false }).limit(1).maybeSingle();
            if (!row) return fail();
            await db.from('setting_auth_otps').update({ verified: 1 }).eq('id', row.id);
            ({ session } = await sessionForEmail(profile.email, { create: true }));
        }
        await recordAuthLog({ userId: profile?.id, username: profile?.username || value, action: 'LOGIN_SUCCESS', status: 'SUCCESS', ip, userAgent, details: { method: `otp_${channel}` } });
        return { ok: true, data: { session: sessionPayload(session) } };
    });
}
