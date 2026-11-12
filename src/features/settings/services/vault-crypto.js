import crypto from 'crypto';
import { getRequiredServerConfig } from '../../../shared/config/server-config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
function getVaultSalt() {
    return getRequiredServerConfig().vaultKeySalt;
}

function deriveKeyPBKDF2(masterKey) {
    const keyStr = String(masterKey ?? '');
    return crypto.pbkdf2Sync(keyStr, getVaultSalt(), 100000, 32, 'sha256');
}

function deriveKeyLegacySHA256(masterKey) {
    const keyStr = String(masterKey ?? '');
    return crypto.createHash('sha256').update(keyStr, 'utf8').digest();
}

export function encrypt(text, masterKey) {
    if (!masterKey || String(masterKey).trim().length < 8) {
        throw new Error('Master key must be at least 8 characters long');
    }
    const key = deriveKeyPBKDF2(masterKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(String(text ?? ''), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        ciphertext: encrypted
    };
}

export function decrypt(ciphertext, ivHex, tagHex, masterKey) {
    if (!ciphertext || !ivHex || !tagHex || !masterKey) return '';

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    try {
        const key = deriveKeyPBKDF2(masterKey);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        try {
            const legacyKey = deriveKeyLegacySHA256(masterKey);
            const decipherLegacy = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
            decipherLegacy.setAuthTag(tag);
            let decrypted = decipherLegacy.update(ciphertext, 'hex', 'utf8');
            decrypted += decipherLegacy.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[vault-crypto] Decryption failed or tag mismatch:', err?.message);
            return null;
        }
    }
}
