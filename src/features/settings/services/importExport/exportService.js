/**
 * Export Pipeline Service
 * Section 34.9 — Orbit Architecture v2
 */

// Blacklisted sensitive keys that MUST NEVER be exported
const SENSITIVE_KEYS = new Set([
    'password_hash',
    'password_salt',
    'auth_secret',
    'token',
    'secret',
    'api_key',
    'vault_key_salt',
    'encryption_key'
]);

export function sanitizeExportPayload(records = []) {
    if (!Array.isArray(records)) return [];

    return records.map((record) => {
        const item = typeof record.toJSON === 'function' ? record.toJSON() : { ...record };
        const clean = {};
        for (const [key, value] of Object.entries(item)) {
            if (!SENSITIVE_KEYS.has(key.toLowerCase())) {
                clean[key] = value;
            }
        }
        return clean;
    });
}

export function generateExportEnvelope({ scope = 'full', format = 'json', records = [], meta = {} }) {
    const sanitized = sanitizeExportPayload(records);
    return {
        exportVersion: '2.0',
        generatedAt: new Date().toISOString(),
        scope,
        format,
        recordCount: sanitized.length,
        meta,
        data: sanitized
    };
}

const serviceExports = {
    sanitizeExportPayload,
    generateExportEnvelope
};

export default serviceExports;
