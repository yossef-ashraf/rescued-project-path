/**
 * Orbit Architecture v2 — Unified API Response Envelope
 */

export function successResponse(data = null, meta = {}) {
    return Response.json(
        {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta
            }
        },
        { status: 200 }
    );
}

export function createdResponse(data = null, meta = {}) {
    return Response.json(
        {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta
            }
        },
        { status: 201 }
    );
}

export function errorResponse(message = 'An unexpected error occurred', status = 500, details = null) {
    return Response.json(
        {
            success: false,
            error: {
                message,
                details,
                timestamp: new Date().toISOString()
            }
        },
        { status }
    );
}

export function badRequest(message = 'Invalid request parameters', details = null) {
    return errorResponse(message, 400, details);
}

export function unauthorized(message = 'Authentication required') {
    return errorResponse(message, 401);
}

export function forbidden(message = 'Access denied') {
    return errorResponse(message, 403);
}

export function notFound(message = 'Resource not found') {
    return errorResponse(message, 404);
}

const serviceExports = {
    success: successResponse,
    created: createdResponse,
    error: errorResponse,
    badRequest,
    unauthorized,
    forbidden,
    notFound
};

export default serviceExports;
