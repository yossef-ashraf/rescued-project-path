/**
 * Orbit Architecture v2 — Lightweight Schema Validator
 */

export function validateSchema(schema, data) {
    const errors = {};
    const sanitized = {};

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: { _general: 'Payload must be an object' }, data: null };
    }

    for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors[key] = rules.message || `Field '${key}' is required`;
            continue;
        }

        if (value === undefined || value === null) {
            if (rules.default !== undefined) {
                sanitized[key] = rules.default;
            }
            continue;
        }

        // Type check
        if (rules.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (rules.type === 'number') {
                const num = Number(value);
                if (isNaN(num)) {
                    errors[key] = `Field '${key}' must be a valid number`;
                    continue;
                }
                sanitized[key] = num;
            } else if (rules.type === 'boolean') {
                sanitized[key] = Boolean(value);
            } else if (actualType !== rules.type) {
                errors[key] = `Field '${key}' must be of type ${rules.type}`;
                continue;
            } else {
                sanitized[key] = typeof value === 'string' ? value.trim() : value;
            }
        } else {
            sanitized[key] = value;
        }

        // Enum check
        if (rules.enum && !rules.enum.includes(sanitized[key])) {
            errors[key] = `Field '${key}' must be one of: ${rules.enum.join(', ')}`;
            continue;
        }
    }

    const hasErrors = Object.keys(errors).length > 0;
    return {
        valid: !hasErrors,
        errors: hasErrors ? errors : null,
        data: hasErrors ? null : sanitized
    };
}

export default validateSchema;
