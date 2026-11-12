import crypto from 'crypto';
import { AuthLog, User } from '../../../shared/models/index.js';
import { isTokenRevoked } from './sessionRevocation.js';
import { getRequiredServerConfig, getServerConfig } from '../../../shared/config/server-config.js';

function getAuthSecret() {
    return getRequiredServerConfig().authSecret;
}

export function hashPassword(password, existingSalt = null) {
    const salt = existingSalt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
}

export function verifyPassword(password, hash, salt) {
    if (!password || !hash || !salt) return false;
    try {
        const hashedAttempt = crypto.scryptSync(password, salt, 64).toString('hex');
        const bufferA = Buffer.from(hashedAttempt, 'hex');
        const bufferB = Buffer.from(hash, 'hex');
        if (bufferA.length !== bufferB.length) return false;
        return crypto.timingSafeEqual(bufferA, bufferB);
    } catch {
        return false;
    }
}

export function createSessionToken(user, expiresInDays = 7) {
    const secret = getAuthSecret();
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role || 'admin',
        avatar_url: user.avatar_url,
        ver: user.token_version || 1,
        iat: nowSec,
        exp: nowSec + (expiresInDays * 24 * 60 * 60)
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');

    return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const secret = getAuthSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');

    try {
        const sigBuf = Buffer.from(signature);
        const expSigBuf = Buffer.from(expectedSig);
        if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        if (isTokenRevoked(payload)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const forwarded = req.headers?.get?.('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers?.get?.('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
}

export function getUserAgent(req) {
    if (!req) return 'Unknown';
    const ua = req.headers?.get?.('user-agent') || 'Unknown';
    return ua.slice(0, 255);
}

export async function recordAuthLog({ userId = null, username = null, action, status, ip = '127.0.0.1', userAgent = 'Unknown', details = null }) {
    try {
        const detailStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;
        const safeUa = String(userAgent || 'Unknown').slice(0, 255);
        await AuthLog.create({
            user_id: userId,
            username,
            action,
            status,
            ip_address: ip,
            user_agent: safeUa,
            details: detailStr,
            created_at: new Date()
        });
    } catch (err) {
        console.error('Failed to write auth_log:', err.message);
    }
}

const userAuthCache = globalThis.__codexUserAuthCache__ || (globalThis.__codexUserAuthCache__ = new Map());
const USER_AUTH_CACHE_TTL_MS = 15 * 60 * 1000;

export function invalidateUserAuthCache(userId = null) {
    if (userId) {
        userAuthCache.delete(String(userId));
    } else {
        userAuthCache.clear();
    }
}

export async function getAuthenticatedUser(req) {
    try {
        if (!req) return null;
        let token = null;

        const authHeader = req.headers?.get?.('authorization') || '';
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        }

        if (!token) {
            const cookieHeader = req.headers?.get?.('cookie') || '';
            const match = cookieHeader.match(/auth_token=([^;]+)/);
            if (match) token = match[1];
        }

        if (!token) return null;

        const payload = verifySessionToken(token);
        if (!payload || !payload.id) return null;

        const cacheKey = String(payload.id);
        const cached = userAuthCache.get(cacheKey);
        let user = null;

        if (cached && (Date.now() - cached.ts < USER_AUTH_CACHE_TTL_MS)) {
            user = cached.user;
        } else {
            const fallbackUser = {
                id: payload.id,
                username: payload.username,
                email: payload.email,
                name: payload.name,
                role: payload.role || 'admin',
                avatar_url: payload.avatar_url || null,
                token_version: payload.ver || 1
            };

            try {
                const dbUser = await User.findByPk(payload.id, {
                    attributes: ['id', 'name', 'email', 'username', 'role', 'status', 'avatar_url', 'telegram_chat_id', 'phone', 'token_version'],
                    raw: true
                });
                user = dbUser || fallbackUser;
                userAuthCache.set(cacheKey, { user, ts: Date.now() });
            } catch (dbErr) {
                user = fallbackUser;
                userAuthCache.set(cacheKey, { user, ts: Date.now() });
            }
        }

        if (!user) return null;

        if (user.status === 'suspended' || user.status === 'inactive') return null;

        if (payload.ver && user.token_version && payload.ver < user.token_version) {
            return null;
        }

        if (isTokenRevoked(payload)) {
            return null;
        }

        return user;
    } catch (err) {
        console.error('[auth] getAuthenticatedUser error:', err?.message || err);
        return null;
    }
}

export function validateApiKey(req) {
    if (!req) return false;
    const expectedKey = getServerConfig().apiKey;
    if (!expectedKey || expectedKey.trim().length === 0) return false;
    
    const apiKeyHeader = req.headers?.get?.('x-api-key') || '';
    const authHeader = req.headers?.get?.('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    const providedKey = (apiKeyHeader || bearerKey).trim();
    if (!providedKey) return false;

    try {
        const provBuf = Buffer.from(providedKey);
        const expBuf = Buffer.from(expectedKey);
        if (provBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(provBuf, expBuf);
    } catch {
        return false;
    }
}

export function isRequestSecure(req) {
    if (!req) return false;
    return req.headers?.get?.('x-is-secure') === '1' ||
           req.headers?.get?.('x-forwarded-proto') === 'https' ||
           Boolean(req.url?.startsWith('https://'));
}

export function createSessionCookie(token, expiresInDays = 7, req = null) {
    const maxAge = expiresInDays * 24 * 60 * 60;
    const secure = isRequestSecure(req) ? '; Secure' : '';
    return `auth_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearSessionCookie(req = null) {
    const secure = isRequestSecure(req) ? '; Secure' : '';
    return `auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`;
}

