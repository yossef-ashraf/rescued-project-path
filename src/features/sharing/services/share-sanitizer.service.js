/**
 * Service: Share Sanitizer
 * Section 30 — Master Plan
 * Strips private notes, secrets, internal IDs, and sensitive fields.
 */

const SENSITIVE_KEYS = new Set([
    'password',
    'password_hash',
    'vault_key',
    'private_notes',
    'secret',
    'token',
    'token_hash',
    'internal_id',
    'auth_token'
]);

export function sanitizeSharedEntity(entity, scopeType) {
    if (!entity) return null;
    const raw = typeof entity.toJSON === 'function' ? entity.toJSON() : { ...entity };

    // Deep sanitize object
    function cleanObj(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(cleanObj);

        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
            cleaned[key] = cleanObj(value);
        }
        return cleaned;
    }

    const cleaned = cleanObj(raw);

    // Contextual sanitization by scope
    if (scopeType === 'lesson') {
        delete cleaned.private_notes;
    }

    return cleaned;
}

const serviceExports = {
    sanitizeSharedEntity
};

export default serviceExports;
