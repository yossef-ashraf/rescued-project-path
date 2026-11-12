import { Setting } from '@/shared/models/index.js';
import { requireAuth, ok, unauthorized, forbidden, serverError } from '@/shared/utils/response.js';

const SENSITIVE_KEYS = new Set([
    'GOOGLE_DRIVE_CLIENT_SECRET',
    'GOOGLE_DRIVE_REFRESH_TOKEN',
    'GOLD_API_KEY',
    'GMAIL_APP_PASSWORD',
    'TELEGRAM_BOT_TOKEN'
]);

export class SettingsController {
    static async getSettings(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized('Unauthorized: Authentication required.');

            const rows = await Setting.findAll({ order: [['id', 'ASC']] });

            const sanitizedRows = rows.map(r => {
                const isSecret = SENSITIVE_KEYS.has(r.key);
                return {
                    ...r.toJSON(),
                    value: isSecret ? (r.value ? '••••••••' : '') : (r.value || ''),
                    has_value: Boolean(r.value),
                    is_secret: isSecret
                };
            });

            const settingsMap = {};
            rows.forEach(r => {
                settingsMap[r.key] = SENSITIVE_KEYS.has(r.key)
                    ? (r.value ? '••••••••' : '')
                    : (r.value || '');
            });

            return ok({
                settings: sanitizedRows,
                map: settingsMap
            });
        } catch {
            return serverError('Failed to fetch settings');
        }
    }

    static async updateSettings(req) {
        try {
            const user = await requireAuth(req);
            if (!user || user.role !== 'admin') {
                return forbidden('Forbidden: Admin access required.');
            }

            const body = await req.json();
            const settingsToUpdate = body.settings || body;

            if (Array.isArray(settingsToUpdate)) {
                for (const item of settingsToUpdate) {
                    if (!item.key) continue;
                    if (SENSITIVE_KEYS.has(item.key) && item.value === '••••••••') continue;

                    const existing = await Setting.findOne({ where: { key: item.key } });
                    if (existing) {
                        await existing.update({
                            value: item.value || '',
                            updated_at: new Date().toISOString()
                        });
                    } else {
                        await Setting.create({
                            key: item.key,
                            value: item.value || '',
                            category: item.category || 'general',
                            description: item.description || null,
                            created_at: new Date(),
                            updated_at: new Date().toISOString()
                        });
                    }
                }
            } else if (typeof settingsToUpdate === 'object') {
                for (const [key, value] of Object.entries(settingsToUpdate)) {
                    if (SENSITIVE_KEYS.has(key) && (value === '••••••••' || value === '')) continue;

                    const existing = await Setting.findOne({ where: { key } });
                    if (existing) {
                        await existing.update({
                            value: String(value ?? ''),
                            updated_at: new Date().toISOString()
                        });
                    } else {
                        await Setting.create({
                            key,
                            value: String(value ?? ''),
                            category: 'general',
                            description: null,
                            created_at: new Date(),
                            updated_at: new Date().toISOString()
                        });
                    }
                }
            }

            return ok({ success: true });
        } catch (err) {
            return serverError('Failed to update settings.', null, 'UPDATE_FAILED');
        }
    }
}

export default SettingsController;
