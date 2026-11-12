import { getAuthenticatedUser, validateApiKey } from '../../features/auth/services/auth.js';
import { HTTP, MSG } from '../constants/index.js';

export async function requireAuth(req) {
    if (!req) return null;
    const user = await getAuthenticatedUser(req);
    if (user) return user;
    if (validateApiKey(req)) return { id: 0, username: 'service_api_key', role: 'service', isApiKey: true };
    return null;
}

export function toPlainData(data) {
    if (!data || typeof data !== 'object') return data;
    if (typeof data.get === 'function') {
        try { return data.get({ plain: true }); } catch {}
    }
    if (typeof data.toJSON === 'function') {
        try { return data.toJSON(); } catch {}
    }
    return data;
}

export function ok(data = { success: true }, meta = {}, init = {}) {
    const plain = toPlainData(data);
    const isObject = typeof plain === 'object' && plain !== null && !Array.isArray(plain);
    const payload = {
        ok: true,
        data: plain,
        error: null,
        meta,
        ...(isObject ? plain : {})
    };
    return Response.json(payload, { status: HTTP.OK, ...init });
}

export function created(data = { success: true }, meta = {}, init = {}) {
    const plain = toPlainData(data);
    const isObject = typeof plain === 'object' && plain !== null && !Array.isArray(plain);
    const payload = {
        ok: true,
        data: plain,
        error: null,
        meta,
        ...(isObject ? plain : {})
    };
    return Response.json(payload, { status: HTTP.CREATED, ...init });
}

export function badRequest(error = MSG.MISSING_FIELDS, details = null, code = 'VALIDATION_ERROR') {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Invalid request');
    const payload = {
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: {
            code,
            message: errorMessage,
            ...(details ? { details } : {})
        },
        ...(details ? { details } : {})
    };
    return Response.json(payload, { status: HTTP.BAD_REQUEST });
}

export function unauthorized(error = MSG.UNAUTHORIZED, code = 'UNAUTHORIZED', extra = {}) {
    const errorMessage = typeof error === 'string' ? error : 'Unauthorized access';
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: { code, message: errorMessage },
        ...(extra && typeof extra === 'object' ? extra : {})
    }, { status: HTTP.UNAUTHORIZED });
}

export function forbidden(error = MSG.FORBIDDEN_ADMIN, code = 'FORBIDDEN') {
    const errorMessage = typeof error === 'string' ? error : 'Forbidden';
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: { code, message: errorMessage }
    }, { status: HTTP.FORBIDDEN });
}

export function notFound(error = MSG.NOT_FOUND, code = 'NOT_FOUND') {
    const errorMessage = typeof error === 'string' ? error : 'Resource not found';
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: { code, message: errorMessage }
    }, { status: HTTP.NOT_FOUND });
}

export function conflict(error = 'Resource already exists', details = null, code = 'CONFLICT') {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Resource conflict');
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: {
            code,
            message: errorMessage,
            ...(details ? { details } : {})
        },
        ...(details ? { details } : {})
    }, { status: HTTP.CONFLICT });
}

export function tooManyRequests(error = 'Rate limit exceeded. Please wait a minute.', code = 'RATE_LIMIT_EXCEEDED') {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Rate limit exceeded');
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: { code, message: errorMessage }
    }, { status: HTTP.TOO_MANY_REQUESTS });
}

export function serverError(error = MSG.SERVER_ERROR, details = null, code = 'SERVER_ERROR') {
    const errorMessage = typeof error === 'string' ? error : (error?.message || MSG.SERVER_ERROR);
    return Response.json({
        ok: false,
        data: null,
        error: errorMessage,
        message: errorMessage,
        code,
        errorDetail: {
            code,
            message: errorMessage,
            ...(details ? { details } : {})
        },
        ...(details ? { details } : {})
    }, { status: HTTP.SERVER_ERROR });
}
