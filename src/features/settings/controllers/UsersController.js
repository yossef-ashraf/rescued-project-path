// Workspace user management on Lovable Cloud accounts.
// Profiles keep the original user ids; roles live in user_roles; sign-in credentials live in Cloud auth.
import { User } from '@/shared/models/index.js';
import { recordAuthLog, getClientIp, getUserAgent } from '@/features/auth/services/auth.js';
import { requireAuth, ok, created, badRequest, forbidden, notFound, conflict, serverError, unauthorized } from '@/shared/utils/response.js';
import { withPrivilegedDb, getDbClient } from '@/shared/database/db-context.server.js';

const ALLOWED_ROLES = new Set(['user', 'admin']);
const ALLOWED_STATUSES = new Set(['active', 'inactive', 'suspended']);

async function requireAdmin(req) {
    const user = await requireAuth(req);
    if (!user) return { error: unauthorized('Unauthorized: Authentication required.') };
    if (user.role !== 'admin') return { error: forbidden('Forbidden: Admin access required.') };
    return { user };
}

async function loadRolesByAuthId(db) {
    const { data, error } = await db.from('user_roles').select('user_id, role');
    if (error) throw new Error(error.message);
    const map = new Map();
    for (const r of data || []) {
        const prev = map.get(r.user_id);
        if (!prev || r.role === 'admin') map.set(r.user_id, r.role);
    }
    return map;
}

async function setRole(db, authUserId, role) {
    await db.from('user_roles').delete().eq('user_id', authUserId);
    if (role) {
        const { error } = await db.from('user_roles').insert({ user_id: authUserId, role });
        if (error) throw new Error(error.message);
    }
}

async function setPendingRole(db, profileId, role) {
    await db.from('pending_user_roles').delete().eq('profile_id', profileId);
    if (role) await db.from('pending_user_roles').insert({ profile_id: profileId, role });
}

function shapeUser(p, roles, pending) {
    return {
        id: String(p.id),
        name: p.name,
        email: p.email,
        username: p.username,
        role: p.auth_user_id ? (roles.get(p.auth_user_id) || null) : (pending.get(String(p.id)) || null),
        status: p.auth_user_id ? (p.status || 'active') : 'invited',
        account_linked: Boolean(p.auth_user_id),
        avatar_url: p.avatar_url,
        last_login_at: p.last_login_at,
        created_at: p.created_at,
        updated_at: p.updated_at,
    };
}

export class UsersController {
    static async getUsers(req) {
        try {
            const { error } = await requireAdmin(req);
            if (error) return error;
            const db = getDbClient();
            const { data: profiles, error: pErr } = await db.from('profiles').select('*').order('id', { ascending: true });
            if (pErr) throw new Error(pErr.message);
            const roles = await loadRolesByAuthId(db);
            const pending = await withPrivilegedDb(async () => {
                const { data } = await getDbClient().from('pending_user_roles').select('profile_id, role');
                return new Map((data || []).map((r) => [String(r.profile_id), r.role]));
            });
            return ok({ success: true, users: (profiles || []).map((p) => shapeUser(p, roles, pending)) });
        } catch (err) {
            console.error('[UsersController.getUsers Error]:', err);
            return serverError(err);
        }
    }

    static async createUser(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);
        try {
            const { user: authUser, error } = await requireAdmin(req);
            if (error) return error;
            const body = await req.json();

            if (body.action === 'change_password') {
                const { id, newPassword } = body;
                if (!id || !newPassword || newPassword.trim().length < 6) {
                    return badRequest('User ID and new password (minimum 6 characters) are required.');
                }
                const target = await User.findByPk(id, { raw: true });
                if (!target) return notFound('User not found.');
                if (!target.auth_user_id) return badRequest('This user has not activated their account yet. They set their password on first sign-in.');
                await withPrivilegedDb(async () => {
                    const { error: e } = await getDbClient().auth.admin.updateUserById(target.auth_user_id, { password: newPassword.trim() });
                    if (e) throw new Error(e.message);
                });
                await recordAuthLog({ userId: id, username: target.username, action: 'PASSWORD_CHANGED', status: 'SUCCESS', ip, userAgent });
                return ok({ success: true, message: 'Password updated successfully' });
            }

            if (body.action === 'toggle_role') {
                const { id } = body;
                if (!id) return badRequest('User ID is required.');
                if (String(authUser.id) === String(id)) return badRequest('You cannot change your own admin role.');
                const target = await User.findByPk(id, { raw: true });
                if (!target) return notFound('User not found.');
                const db = getDbClient();
                if (target.auth_user_id) {
                    const roles = await loadRolesByAuthId(db);
                    const newRole = roles.get(target.auth_user_id) === 'admin' ? 'user' : 'admin';
                    await setRole(db, target.auth_user_id, newRole);
                    return ok({ success: true, role: newRole });
                }
                const newRole = await withPrivilegedDb(async () => {
                    const pdb = getDbClient();
                    const { data } = await pdb.from('pending_user_roles').select('role').eq('profile_id', id);
                    const next = data?.[0]?.role === 'admin' ? 'user' : 'admin';
                    await setPendingRole(pdb, id, next);
                    return next;
                });
                return ok({ success: true, role: newRole });
            }

            if (body.action === 'rename') {
                const { id, newUsername } = body;
                if (!id || !newUsername || !newUsername.trim()) return badRequest('User ID and new username required.');
                const cleanU = newUsername.trim().toLowerCase();
                const existing = await User.findOne({ where: { username: cleanU }, raw: true });
                if (existing && String(existing.id) !== String(id)) return conflict('Username already taken.');
                await User.update({ username: cleanU, updated_at: new Date() }, { where: { id } });
                return ok({ success: true, username: cleanU });
            }

            if (body.action === 'delete' || body.action === 'delete_user') return UsersController.deleteUser(req, body);
            if (['update', 'edit', 'update_user', 'edit_user'].includes(body.action)) return UsersController.updateUser(req, body);

            const { name, email, username, password, role = 'user', status = 'active' } = body;
            if (!ALLOWED_ROLES.has(role)) return badRequest('Invalid role. Allowed roles: user, admin');
            if (!ALLOWED_STATUSES.has(status)) return badRequest('Invalid status. Allowed statuses: active, inactive, suspended');
            if (!name || !email || !username || !password) return badRequest('Name, email, username, and password are required.');
            if (password.length < 6) return badRequest('Password must be at least 6 characters long.');

            const cleanEmail = email.trim().toLowerCase();
            const cleanUsername = username.trim().toLowerCase();
            const [byEmail, byUsername] = await Promise.all([
                User.findOne({ where: { email: cleanEmail }, raw: true }),
                User.findOne({ where: { username: cleanUsername }, raw: true }),
            ]);
            if (byEmail?.auth_user_id || byUsername) {
                if (!(byEmail && byUsername && String(byEmail.id) === String(byUsername.id) && !byEmail.auth_user_id)) {
                    return conflict('A user with this email or username already exists.');
                }
            }

            // Pre-create the profile so the account-link trigger attaches the new login to it.
            let profile = byEmail && !byEmail.auth_user_id ? byEmail : null;
            if (!profile) {
                const inst = await User.create({ name: name.trim(), email: cleanEmail, username: cleanUsername, status, created_at: new Date(), updated_at: new Date() });
                profile = inst.get({ plain: true });
            } else {
                await User.update({ name: name.trim(), username: cleanUsername, status }, { where: { id: profile.id } });
            }

            const authUserId = await withPrivilegedDb(async () => {
                const pdb = getDbClient();
                const { data, error: e } = await pdb.auth.admin.createUser({
                    email: cleanEmail,
                    password,
                    email_confirm: true,
                    user_metadata: { name: name.trim() },
                });
                if (e) throw new Error(e.message);
                await setRole(pdb, data.user.id, role);
                return data.user.id;
            });

            await recordAuthLog({ username: cleanUsername, action: 'USER_CREATED', status: 'SUCCESS', ip, userAgent, details: { createdUserId: profile.id, role, email: cleanEmail } });
            return created({
                success: true,
                user: { id: String(profile.id), name: name.trim(), email: cleanEmail, username: cleanUsername, role, status, account_linked: Boolean(authUserId), created_at: profile.created_at },
            });
        } catch (err) {
            console.error('[UsersController.createUser Error]:', err);
            if (/already been registered|already exists/i.test(err?.message || '')) return conflict('A user with this email already exists.');
            return serverError(err);
        }
    }

    static async updateUser(req, passedBody = null) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);
        try {
            const { user: authUser, error } = await requireAdmin(req);
            if (error) return error;
            const body = passedBody || (await req.json().catch(() => ({})));
            const { id, name, email, username, role, status, newPassword } = body;
            if (!id) return badRequest('User ID is required.');
            const target = await User.findByPk(id, { raw: true });
            if (!target) return notFound('User not found.');

            if (role !== undefined && role !== null && role !== '' && !ALLOWED_ROLES.has(role)) return badRequest('Invalid role. Allowed roles: user, admin');
            if (status !== undefined && !ALLOWED_STATUSES.has(status) && status !== 'invited') return badRequest('Invalid status. Allowed statuses: active, inactive, suspended');
            if (String(authUser.id) === String(id)) {
                if (role && role !== 'admin') return badRequest('You cannot remove admin role from your own account.');
                if (status && status !== 'active') return badRequest('You cannot deactivate or suspend your own account.');
            }

            const updateData = { updated_at: new Date() };
            if (name !== undefined) updateData.name = name ? name.trim() : target.name;
            if (username !== undefined && username) updateData.username = username.trim().toLowerCase();
            if (status !== undefined && status !== 'invited') updateData.status = status;
            const newEmail = email !== undefined && email ? email.trim().toLowerCase() : null;
            if (newEmail && newEmail !== target.email) updateData.email = newEmail;
            await User.update(updateData, { where: { id } });

            await withPrivilegedDb(async () => {
                const pdb = getDbClient();
                if (target.auth_user_id) {
                    const patch = {};
                    if (newEmail && newEmail !== target.email) { patch.email = newEmail; patch.email_confirm = true; }
                    if (newPassword && newPassword.trim().length >= 6) patch.password = newPassword.trim();
                    if (Object.keys(patch).length) {
                        const { error: e } = await pdb.auth.admin.updateUserById(target.auth_user_id, patch);
                        if (e) throw new Error(e.message);
                    }
                    if (role !== undefined) await setRole(pdb, target.auth_user_id, role || null);
                } else if (role !== undefined) {
                    await setPendingRole(pdb, id, role || null);
                }
            });

            await recordAuthLog({ userId: id, username: target.username, action: 'USER_UPDATED', status: 'SUCCESS', ip, userAgent, details: { updatedUserId: id } });
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
            const { user: authUser, error } = await requireAdmin(req);
            if (error) return error;
            let id = passedBody?.id || null;
            if (!id) { try { id = (await req.json())?.id; } catch { /* no body */ } }
            if (!id) id = new URL(req.url).searchParams.get('id');
            if (!id) return badRequest('User ID is required.');
            if (String(authUser.id) === String(id)) return badRequest('You cannot delete your own admin account.');
            const target = await User.findByPk(id, { raw: true });
            if (!target) return notFound('User not found.');

            await withPrivilegedDb(async () => {
                const pdb = getDbClient();
                if (target.auth_user_id) {
                    const { error: e } = await pdb.auth.admin.deleteUser(target.auth_user_id);
                    if (e) throw new Error(e.message);
                }
                await pdb.from('profiles').delete().eq('id', id);
            });
            await recordAuthLog({ userId: null, username: target.username, action: 'USER_DELETED', status: 'SUCCESS', ip, userAgent, details: { deletedUserId: id } });
            return ok({ success: true, message: 'User deleted successfully.' });
        } catch (err) {
            console.error('[UsersController.deleteUser Error]:', err);
            return serverError(err);
        }
    }
}

export default UsersController;
