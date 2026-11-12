import { Op, fn, col, where } from '@/shared/database/orm.js';
import { User } from '@/shared/models/index.js';
import { hashPassword, recordAuthLog, getClientIp, getUserAgent } from '@/features/auth/services/auth.js';
import { requireAuth, ok, created, badRequest, unauthorized, forbidden, notFound, conflict, serverError } from '@/shared/utils/response.js';

export class UsersController {
    static async getUsers(req) {
        try {
            const currentUser = await requireAuth(req);
            if (!currentUser) return unauthorized('Unauthorized: Authentication required.');
            if (currentUser.role !== 'admin') {
                return forbidden('Forbidden: Admin access required.');
            }

            const users = await User.findAll({
                attributes: ['id', 'name', 'email', 'username', 'role', 'status', 'avatar_url', 'last_login_at', 'created_at', 'updated_at'],
                order: [['id', 'ASC']],
                raw: true
            });
            return ok({ success: true, users: users || [] });
        } catch (err) {
            console.error('[UsersController.getUsers Error]:', err);
            return serverError(err);
        }
    }

    static async createUser(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        try {
            const authUser = await requireAuth(req);
            if (!authUser || authUser.role !== 'admin') {
                return forbidden('Forbidden: Admin access required.');
            }

            const body = await req.json();

            if (body.action === 'change_password') {
                const { id, newPassword } = body;
                if (!id || !newPassword || newPassword.trim().length < 6) {
                    return badRequest('User ID and new password (minimum 6 characters) are required.');
                }
                const targetUser = await User.findByPk(id);
                if (!targetUser) return notFound('User not found.');
                const { salt, hash } = hashPassword(newPassword.trim());
                await User.update({ password_hash: hash, password_salt: salt, updated_at: new Date() }, { where: { id } });
                await recordAuthLog({
                    userId: id,
                    username: targetUser.username,
                    action: 'PASSWORD_CHANGED',
                    status: 'SUCCESS',
                    ip,
                    userAgent
                });
                return ok({ success: true, message: 'Password updated successfully' });
            }

            if (body.action === 'toggle_role') {
                const { id } = body;
                if (!id) return badRequest('User ID is required.');
                if (authUser.id === parseInt(id, 10)) {
                    return badRequest('You cannot change your own admin role.');
                }
                const targetUser = await User.findByPk(id);
                if (!targetUser) return notFound('User not found.');
                const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
                await User.update({ role: newRole, updated_at: new Date() }, { where: { id } });
                return ok({ success: true, role: newRole });
            }

            if (body.action === 'rename') {
                const { id, newUsername } = body;
                if (!id || !newUsername || !newUsername.trim()) return badRequest('User ID and new username required.');
                const cleanU = newUsername.trim().toLowerCase();
                const existing = await User.findOne({
                    where: where(fn('LOWER', col('username')), cleanU),
                    raw: true
                });
                if (existing && existing.id !== parseInt(id, 10)) {
                    return conflict('Username already taken.');
                }
                await User.update({ username: cleanU, updated_at: new Date() }, { where: { id } });
                return ok({ success: true, username: cleanU });
            }

            if (body.action === 'delete' || body.action === 'delete_user') {
                return UsersController.deleteUser(req, body);
            }

            if (body.action === 'update' || body.action === 'edit' || body.action === 'update_user' || body.action === 'edit_user') {
                return UsersController.updateUser(req, body);
            }

            const { name, email, username, password, role = 'user', status = 'active' } = body;

            const ALLOWED_ROLES = new Set(['user', 'admin']);
            const ALLOWED_STATUSES = new Set(['active', 'inactive', 'suspended']);

            if (!ALLOWED_ROLES.has(role)) {
                return badRequest('Invalid role. Allowed roles: user, admin');
            }
            if (!ALLOWED_STATUSES.has(status)) {
                return badRequest('Invalid status. Allowed statuses: active, inactive, suspended');
            }

            if (!name || !email || !username || !password) {
                return badRequest('Name, email, username, and password are required.');
            }

            if (password.length < 6) {
                return badRequest('Password must be at least 6 characters long.');
            }

            const cleanEmail = email.trim().toLowerCase();
            const cleanUsername = username.trim().toLowerCase();

            const existing = await User.findOne({
                attributes: ['id'],
                where: {
                    [Op.or]: [
                        where(fn('LOWER', col('email')), cleanEmail),
                        where(fn('LOWER', col('username')), cleanUsername)
                    ]
                },
                raw: true
            });

            if (existing) {
                return conflict('A user with this email or username already exists.');
            }

            const { salt, hash } = hashPassword(password);

            const newUser = await User.create({
                name: name.trim(),
                email: cleanEmail,
                username: cleanUsername,
                password_hash: hash,
                password_salt: salt,
                role,
                status,
                created_at: new Date(),
                updated_at: new Date()
            });

            await recordAuthLog({
                username: cleanUsername,
                action: 'USER_CREATED',
                status: 'SUCCESS',
                ip,
                userAgent,
                details: { createdUserId: newUser.id, role, email: cleanEmail }
            });

            return created({
                success: true,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role,
                    status: newUser.status,
                    created_at: newUser.created_at
                }
            });
        } catch (err) {
            console.error('[UsersController.createUser Error]:', err);
            return serverError(err);
        }
    }

    static async updateUser(req, passedBody = null) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        try {
            const authUser = await requireAuth(req);
            if (!authUser || authUser.role !== 'admin') {
                return forbidden('Forbidden: Admin access required.');
            }

            const body = passedBody || (await req.json().catch(() => ({})));
            const { id, name, email, username, role, status, newPassword } = body;

            if (!id) return badRequest('User ID is required.');

            const currentUser = await User.findByPk(id, {
                attributes: ['id', 'username', 'password_hash', 'password_salt'],
                raw: true
            });

            if (!currentUser) return notFound('User not found.');

            let hash = currentUser.password_hash;
            let salt = currentUser.password_salt;

            if (newPassword && newPassword.trim().length >= 6) {
                const hashed = hashPassword(newPassword.trim());
                hash = hashed.hash;
                salt = hashed.salt;
            }

            const ALLOWED_ROLES = new Set(['user', 'admin']);
            const ALLOWED_STATUSES = new Set(['active', 'inactive', 'suspended']);

            if (role !== undefined && !ALLOWED_ROLES.has(role)) {
                return badRequest('Invalid role. Allowed roles: user, admin');
            }
            if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
                return badRequest('Invalid status. Allowed statuses: active, inactive, suspended');
            }

            if (authUser.id === parseInt(id, 10)) {
                if (role && role !== 'admin') {
                    return badRequest('You cannot remove admin role from your own account.');
                }
                if (status && status !== 'active') {
                    return badRequest('You cannot deactivate or suspend your own account.');
                }
            }

            const updateData = {
                password_hash: hash,
                password_salt: salt,
                updated_at: new Date()
            };
            if (name !== undefined) updateData.name = name ? name.trim() : null;
            if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
            if (username !== undefined) updateData.username = username ? username.trim().toLowerCase() : null;
            if (role !== undefined) updateData.role = role || null;
            if (status !== undefined) updateData.status = status || null;

            await User.update(updateData, { where: { id } });

            await recordAuthLog({
                userId: id,
                username: currentUser.username,
                action: newPassword ? 'PASSWORD_CHANGED' : 'USER_UPDATED',
                status: 'SUCCESS',
                ip,
                userAgent,
                details: { changedFields: Object.keys(body).filter(k => k !== 'newPassword') }
            });

            return ok({ success: true, message: 'User updated successfully.' });
        } catch (err) {
            console.error('[UsersController.updateUser Error]:', err);
            return serverError(err);
        }
    }

    static async deleteUser(req, passedBody = null) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        try {
            const authUser = await requireAuth(req);
            if (!authUser || authUser.role !== 'admin') {
                return forbidden('Forbidden: Admin access required.');
            }

            let id = passedBody?.id || null;
            if (!id) {
                try {
                    const body = await req.json();
                    id = body?.id;
                } catch {
                }
            }
            if (!id) {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id');
            }

            if (!id) return badRequest('User ID is required.');

            if (authUser.id === parseInt(id, 10)) {
                return badRequest('You cannot delete your own admin account.');
            }

            const userToDelete = await User.findByPk(id, {
                attributes: ['username'],
                raw: true
            });
            if (!userToDelete) return notFound('User not found.');

            await User.destroy({ where: { id } });

            await recordAuthLog({
                userId: id,
                username: userToDelete.username,
                action: 'USER_DELETED',
                status: 'SUCCESS',
                ip,
                userAgent,
                details: { deletedUserId: id }
            });

            return ok({ success: true, message: 'User deleted successfully.' });
        } catch (err) {
            console.error('[UsersController.deleteUser Error]:', err);
            return serverError(err);
        }
    }
}

export default UsersController;
