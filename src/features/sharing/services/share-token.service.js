import crypto from 'crypto';

/**
 * Service: Share Token Generator & Hasher
 * Section 30 — Master Plan
 * Entropy: 32 random bytes, store SHA-256 token_hash only.
 */

export function generateOpaqueToken() {
    return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Valid token string required for hashing');
    }
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function verifyTokenHash(token, tokenHash) {
    if (!token || !tokenHash) return false;
    const computed = hashToken(token);
    try {
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(tokenHash));
    } catch {
        return false;
    }
}

const serviceExports = {
    generateOpaqueToken,
    hashToken,
    verifyTokenHash
};

export default serviceExports;
