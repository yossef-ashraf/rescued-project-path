import { sequelize, User, Setting } from '../../../shared/models/index.js';
import { loadSessionEpochs, saveSessionEpochs, isTokenRevoked } from './sessionEpoch.js';

export { isTokenRevoked, loadSessionEpochs, saveSessionEpochs };

export async function revokeAllSessions() {
    const nowSec = Math.floor(Date.now() / 1000);
    const epochs = {
        globalEpoch: nowSec,
        userEpochs: {}
    };
    saveSessionEpochs(epochs);

    try {
        if (sequelize) {
            await sequelize.query('UPDATE users SET token_version = COALESCE(token_version, 1) + 1');
        }

        const existing = await Setting.findOne({ where: { key: 'global_session_epoch' } });
        if (existing) {
            await existing.update({
                value: String(nowSec),
                updated_at: new Date().toISOString()
            });
        } else {
            await Setting.create({
                key: 'global_session_epoch',
                value: String(nowSec),
                category: 'auth',
                description: 'Global session epoch timestamp',
                created_at: new Date(),
                updated_at: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error('Failed to update DB on revokeAllSessions:', err.message);
    }

    return { success: true, timestamp: nowSec };
}

export async function revokeUserSessions(userId) {
    const nowSec = Math.floor(Date.now() / 1000);
    const epochs = loadSessionEpochs();
    if (!epochs.userEpochs) epochs.userEpochs = {};
    epochs.userEpochs[String(userId)] = nowSec;
    saveSessionEpochs(epochs);

    try {
        if (sequelize) {
            await sequelize.query('UPDATE users SET token_version = COALESCE(token_version, 1) + 1 WHERE id = :userId', {
                replacements: { userId }
            });
        }
    } catch (err) {
        console.error('Failed to update DB on revokeUserSessions:', err.message);
    }

    return { success: true, userId, timestamp: nowSec };
}
