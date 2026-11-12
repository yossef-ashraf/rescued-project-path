// Sign-in, sign-up, password reset and sign-out now happen in the browser through Lovable Cloud auth.
// The server keeps the session-info, sign-in history and "sign out everywhere" endpoints.
import { AuthLog, User } from '@/shared/models/index.js';
import { Op } from '@/shared/database/orm.js';
import { getClientIp, getUserAgent, recordAuthLog, getAuthenticatedUser } from '@/features/auth/services/auth.js';
import { ok, unauthorized, forbidden, serverError, badRequest } from '@/shared/utils/response.js';
import { getRequestContext, withPrivilegedDb, getDbClient } from '@/shared/database/db-context.server.js';

export class AuthController {
    static async login() {
        return badRequest('Sign in with your email and password on the sign-in page.', null, 'USE_CLOUD_AUTH');
    }

    static async sendOtp() {
        return badRequest('One-time codes were replaced by email and password sign-in.', null, 'USE_CLOUD_AUTH');
    }

    static async me(req) {
        try {
            const ctx = getRequestContext();
            const user = await getAuthenticatedUser(req);
            if (!user) {
                const pending = ctx?.status === 'pending';
                return unauthorized(pending ? 'Your account is waiting for an admin to grant access.' : 'Not authenticated',
                    pending ? 'ACCESS_PENDING' : 'NOT_AUTHENTICATED',
                    { authenticated: false, pending, user: pending ? { email: ctx?.user?.email, name: ctx?.user?.name } : null });
            }
            if (user.id) {
                User.update({ last_login_at: new Date(), last_login_ip: getClientIp(req) }, { where: { id: user.id } }).catch(() => {});
            }
            return ok({
                authenticated: true,
                user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, avatar_url: user.avatar_url, status: user.status }
            });
        } catch (err) {
            return serverError(err);
        }
    }

    static async sessionEvent(req) {
        const user = await getAuthenticatedUser(req);
        if (!user) return unauthorized('Not authenticated');
        const body = await req.json().catch(() => ({}));
        const action = body?.event === 'PASSWORD_SET' ? 'PASSWORD_SET' : 'LOGIN_SUCCESS';
        await recordAuthLog({ userId: user.id, username: user.username, action, status: 'SUCCESS', ip: getClientIp(req), userAgent: getUserAgent(req), details: { role: user.role, method: body?.method || 'password' } });
        return ok({ success: true });
    }

    static async logout(req) {
        try {
            const user = await getAuthenticatedUser(req);
            if (user) {
                await recordAuthLog({ userId: user.id, username: user.username, action: 'LOGOUT', status: 'SUCCESS', ip: getClientIp(req), userAgent: getUserAgent(req), details: { role: user.role } });
            }
            return ok({ success: true, message: 'Logged out successfully' });
        } catch (err) {
            return serverError(err);
        }
    }

    static async logoutAll(req) {
        try {
            const currentUser = await getAuthenticatedUser(req);
            if (!currentUser) return unauthorized('Unauthorized: Authentication required.');
            let body = {};
            try { body = await req.json(); } catch { /* empty */ }
            const targetUserId = body.userId || new URL(req.url).searchParams.get('userId');
            const isSelf = !targetUserId || String(targetUserId) === String(currentUser.id);
            if (!isSelf && currentUser.role !== 'admin') return forbidden('Forbidden: Only admins can revoke sessions for other users.');
            if (body.all && currentUser.role !== 'admin') return forbidden('Forbidden: Only admins can revoke all sessions.');

            await withPrivilegedDb(async () => {
                const admin = getDbClient().auth.admin;
                if (isSelf && !body.all) {
                    await admin.signOut(currentUser.accessToken, 'global');
                    return;
                }
                // Revoke other users by forcing their refresh tokens out: a short ban ends every session.
                const { data: profiles } = await getDbClient().from('profiles').select('id, auth_user_id').not('auth_user_id', 'is', null);
                const targets = (profiles || []).filter((p) => (body.all ? String(p.id) !== String(currentUser.id) : String(p.id) === String(targetUserId)));
                for (const t of targets) {
                    await admin.updateUserById(t.auth_user_id, { ban_duration: '1s' });
                    await admin.updateUserById(t.auth_user_id, { ban_duration: 'none' });
                }
                if (body.all) await admin.signOut(currentUser.accessToken, 'global');
            });
            await recordAuthLog({ userId: currentUser.id, username: currentUser.username, action: body.all ? 'REVOKE_ALL_SESSIONS' : 'REVOKE_USER_SESSIONS', status: 'SUCCESS', ip: getClientIp(req), userAgent: getUserAgent(req), details: { targetUserId: targetUserId || currentUser.id } });
            return ok({ success: true, message: 'Sessions revoked', signedOutSelf: isSelf || Boolean(body.all) });
        } catch (err) {
            return serverError(err);
        }
    }

    static async logs(req) {
        try {
            const user = await getAuthenticatedUser(req);
            if (!user) {
                return unauthorized('Unauthorized');
            }
            if (user.role !== 'admin') return forbidden('Admin access required.');

            const { searchParams } = new URL(req.url);
            const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
            const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '30', 10)));
            const offset = (page - 1) * limit;

            const action = searchParams.get('action') || 'all';
            const status = searchParams.get('status') || 'all';
            const search = (searchParams.get('search') || '').trim().toLowerCase();

            const whereClause = {};
            if (action !== 'all') whereClause.action = action;
            if (status !== 'all') whereClause.status = status;
            if (search) {
                whereClause[Op.or] = [
                    { username: { [Op.iLike]: `%${search}%` } },
                    { ip_address: { [Op.iLike]: `%${search}%` } },
                    { action: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { count, rows } = await AuthLog.findAndCountAll({
                where: whereClause,
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const totalToday = await AuthLog.count({
                where: { created_at: { [Op.gte]: today } }
            });

            const successToday = await AuthLog.count({
                where: {
                    action: 'LOGIN_SUCCESS',
                    created_at: { [Op.gte]: today }
                }
            });

            const failedToday = await AuthLog.count({
                where: {
                    action: 'LOGIN_FAILED',
                    created_at: { [Op.gte]: today }
                }
            });

            const activeUsers = await User.count({
                where: { status: 'active' }
            });

            return ok({
                success: true,
                logs: rows || [],
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                },
                stats: {
                    totalToday,
                    successToday,
                    failedToday,
                    activeUsers
                }
            });
        } catch (err) {
            return serverError(err);
        }
    }
}

export default AuthController;
