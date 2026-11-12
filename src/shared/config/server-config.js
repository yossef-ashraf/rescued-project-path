if (typeof window !== 'undefined') {
    throw new Error('Server config cannot be accessed from client environment.');
}

export function getServerConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    const authSecret = process.env.AUTH_SECRET;
    const vaultKeySalt = process.env.VAULT_KEY_SALT;
    const apiKey = process.env.API_KEY;
    const cronSecret = process.env.CRON_SECRET;
    const nodeEnv = process.env.NODE_ENV || 'development';

    const baseUrl = process.env.BASE_URL || '';

    return {
        databaseUrl,
        authSecret,
        vaultKeySalt,
        apiKey,
        cronSecret,
        baseUrl,
        nodeEnv,
        isProduction: nodeEnv === 'production',
        isDevelopment: nodeEnv === 'development'
    };
}

export function getRequiredServerConfig() {
    const config = getServerConfig();
    const missing = [];

    if (!config.databaseUrl) missing.push('DATABASE_URL');
    if (!config.authSecret) missing.push('AUTH_SECRET');
    if (!config.vaultKeySalt) missing.push('VAULT_KEY_SALT');

    if (missing.length > 0) {
        throw new Error(`Required environment variable(s) missing: ${missing.join(', ')}`);
    }

    return config;
}

export default getServerConfig;

