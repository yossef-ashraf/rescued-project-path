import { VaultPassword } from '@/shared/models/index.js';
import { requireAuth, ok, badRequest, unauthorized } from '@/shared/utils/response.js';
import { encrypt, decrypt } from '@/features/settings/services/vault-crypto.js';
import { apiError } from '@/shared/utils/api-error.js';

export class VaultController {
    static async handleGet(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized('Unauthorized session');
            const count = await VaultPassword.count();
            return ok({ success: true, count, locked: true });
        } catch (err) {
            return apiError(err);
        }
    }

    static async handleAction(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized('Unauthorized session');

            const body = await req.json();
            const { action, masterKey, encryptionKey, id, site_name, site_url, user_data, password } = body;
            const targetId = id || body.passwordId;

            if (action === 'delete' || action === 'delete_password') {
                if (!targetId) return badRequest('Missing entry ID');
                await VaultPassword.destroy({ where: { id: targetId } });
                return ok({ success: true });
            }

            const effectiveKey = String(encryptionKey || masterKey || '').trim();
            if (action !== 'delete' && action !== 'delete_password' && (!effectiveKey || effectiveKey.length < 8)) {
                return badRequest('Master key is required and must be at least 8 characters long.');
            }

            if (action === 'list' || action === 'get_passwords') {
                const rows = await VaultPassword.findAll({ order: [['id', 'DESC']] });
                if (!rows || rows.length === 0) {
                    return ok({ success: true, passwords: [] });
                }

                const decryptedList = rows.map((r) => {
                    const decryptedUser = decrypt(r.user_data_encrypted, r.user_data_iv, r.user_data_tag, effectiveKey);
                    const decryptedPass = decrypt(r.password_encrypted, r.password_iv, r.password_tag, effectiveKey);

                    return {
                        id: r.id,
                        site_name: r.site_name,
                        site_url: r.site_url || '',
                        user_data: decryptedUser,
                        password: decryptedPass,
                        created_at: r.created_at,
                        updated_at: r.updated_at
                    };
                });

                return ok({ success: true, passwords: decryptedList }, {
                    headers: {
                        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                        'Pragma': 'no-cache'
                    }
                });
            }

            if (action === 'create' || action === 'add' || action === 'create_password' || action === 'add_password') {
                if (!site_name || !user_data || !password) {
                    return badRequest('Site name, user data, and password are required');
                }

                const encUser = encrypt(user_data, effectiveKey);
                const encPass = encrypt(password, effectiveKey);

                const created = await VaultPassword.create({
                    site_name: site_name.trim(),
                    site_url: site_url ? site_url.trim() : '',
                    user_data_encrypted: encUser.ciphertext,
                    user_data_iv: encUser.iv,
                    user_data_tag: encUser.tag,
                    password_encrypted: encPass.ciphertext,
                    password_iv: encPass.iv,
                    password_tag: encPass.tag,
                    created_at: new Date(),
                    updated_at: new Date().toISOString()
                });

                return ok({ success: true, id: created.id });
            }

            if (action === 'update' || action === 'edit' || action === 'update_password' || action === 'edit_password') {
                if (!targetId || !site_name) {
                    return badRequest('Missing required update fields');
                }

                if (user_data !== undefined && password !== undefined) {
                    const encUser = encrypt(user_data, effectiveKey);
                    const encPass = encrypt(password, effectiveKey);

                    await VaultPassword.update({
                        site_name: site_name.trim(),
                        site_url: site_url ? site_url.trim() : '',
                        user_data_encrypted: encUser.ciphertext,
                        user_data_iv: encUser.iv,
                        user_data_tag: encUser.tag,
                        password_encrypted: encPass.ciphertext,
                        password_iv: encPass.iv,
                        password_tag: encPass.tag,
                        updated_at: new Date().toISOString()
                    }, { where: { id } });
                } else {
                    await VaultPassword.update({
                        site_name: site_name.trim(),
                        site_url: site_url ? site_url.trim() : '',
                        updated_at: new Date().toISOString()
                    }, { where: { id } });
                }

                return ok({ success: true });
            }

            return badRequest('Invalid action specified');
        } catch (err) {
            return apiError(err);
        }
    }
}

export default VaultController;
