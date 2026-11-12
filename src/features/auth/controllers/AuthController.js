import { Op } from '@/shared/database/orm.js';
import { User, AuthLog } from '@/shared/models/index.js';
import { verifyPassword, createSessionToken, getClientIp, getUserAgent, recordAuthLog, getAuthenticatedUser, createSessionCookie, clearSessionCookie } from '@/features/auth/services/auth.js';
import { verifyOtpCode, createAndSendOtp } from '@/features/auth/services/otp-service.js';
import { checkRateLimit } from '@/features/auth/services/rate-limit.js';
import { revokeAllSessions, revokeUserSessions } from '@/features/auth/services/sessionRevocation.js';
import { ok, badRequest, unauthorized, forbidden, tooManyRequests, serverError } from '@/shared/utils/response.js';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const MAX_OTP_ATTEMPTS = 5;

export class AuthController {
    static async login(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!checkRateLimit(`login:${ip}`, MAX_LOGIN_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            return tooManyRequests('Too many login attempts. Please wait 5 minutes before trying again.');
        }

        try {
            const body = await req.json();
            const login = body.login || body.username || body.email || body.identifier;
            const { password, otp, targetDestination, rememberMe } = body;

            if (!login || (!password && !otp)) {
                return badRequest('Please enter your login and OTP code or password.');
            }

            const cleanLogin = login.trim().toLowerCase();

            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: cleanLogin },
                        { username: cleanLogin },
                        { phone: cleanLogin }
                    ]
                }
            });

            if (!user) {
                await recordAuthLog({
                    username: cleanLogin,
                    action: 'LOGIN_FAILED',
                    status: 'FAILED',
                    ip,
                    userAgent,
                    details: { reason: 'User not found', attempted: cleanLogin }
                });
                return unauthorized('Invalid account credentials.');
            }

            if (user.status === 'suspended' || user.status === 'inactive') {
                await recordAuthLog({
                    userId: user.id,
                    username: user.username,
                    action: 'LOGIN_BLOCKED',
                    status: 'WARNING',
                    ip,
                    userAgent,
                    details: { reason: 'Account suspended or inactive' }
                });
                return forbidden('This account is currently suspended. Please contact the administrator.');
            }

            if (otp) {
                const destToVerify = (targetDestination || user.email || user.telegram_chat_id || user.phone || cleanLogin).trim().toLowerCase();
                let otpCheck = await verifyOtpCode(destToVerify, otp);

                if (!otpCheck.valid && user.email) {
                    otpCheck = await verifyOtpCode(user.email.toLowerCase(), otp);
                }
                if (!otpCheck.valid && user.telegram_chat_id) {
                    otpCheck = await verifyOtpCode(String(user.telegram_chat_id).toLowerCase(), otp);
                }
                if (!otpCheck.valid && cleanLogin !== destToVerify) {
                    otpCheck = await verifyOtpCode(cleanLogin, otp);
                }

                if (!otpCheck.valid) {
                    await recordAuthLog({
                        userId: user.id,
                        username: user.username,
                        action: 'OTP_LOGIN_FAILED',
                        status: 'FAILED',
                        ip,
                        userAgent,
                        details: { reason: otpCheck.error || 'Invalid OTP code' }
                    });
                    return unauthorized(otpCheck.error || 'Invalid or expired OTP code.');
                }

                await recordAuthLog({
                    userId: user.id,
                    username: user.username,
                    action: 'OTP_LOGIN_SUCCESS',
                    status: 'SUCCESS',
                    ip,
                    userAgent,
                    details: { channel: destToVerify.includes('@') ? 'email' : 'telegram', rememberMe: Boolean(rememberMe) }
                });
            } else {
                const isValid = verifyPassword(password, user.password_hash, user.password_salt);
                if (!isValid) {
                    await recordAuthLog({
                        userId: user.id,
                        username: user.username,
                        action: 'LOGIN_FAILED',
                        status: 'FAILED',
                        ip,
                        userAgent,
                        details: { reason: 'Incorrect password' }
                    });
                    return unauthorized('Invalid account credentials.');
                }

                await recordAuthLog({
                    userId: user.id,
                    username: user.username,
                    action: 'LOGIN_SUCCESS',
                    status: 'SUCCESS',
                    ip,
                    userAgent,
                    details: { role: user.role, rememberMe: Boolean(rememberMe) }
                });
            }

            await user.update({
                last_login_at: new Date(),
                last_login_ip: ip
            });

            const expiresInDays = rememberMe ? 30 : 7;
            const token = createSessionToken(user, expiresInDays);
            const cookieHeader = createSessionCookie(token, expiresInDays, req);

            return new Response(
                JSON.stringify({
                    success: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                        avatar_url: user.avatar_url
                    }
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Set-Cookie': cookieHeader
                    }
                }
            );
        } catch (err) {
            console.error('Login error:', err);
            return serverError('Authentication service error. Please try again.');
        }
    }

    static async logout(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        try {
            const user = await getAuthenticatedUser(req);
            if (user) {
                await recordAuthLog({
                    userId: user.id,
                    username: user.username,
                    action: 'LOGOUT',
                    status: 'SUCCESS',
                    ip,
                    userAgent,
                    details: { role: user.role }
                });
                await revokeUserSessions(user.id);
            }

            const clearCookieHeader = clearSessionCookie(req);

            return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': clearCookieHeader,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
        } catch (err) {
            return serverError(err);
        }
    }

    static async logoutAll(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        try {
            const currentUser = await getAuthenticatedUser(req);
            if (!currentUser) {
                return unauthorized('Unauthorized: Authentication required.');
            }

            const url = new URL(req.url);
            let targetUserId = url.searchParams.get('userId');

            try {
                const body = await req.json();
                if (body.userId) targetUserId = body.userId;
            } catch (_) {}

            if (targetUserId) {
                if (String(targetUserId) !== String(currentUser.id) && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
                    return forbidden('Forbidden: Only admins can revoke sessions for other users.');
                }
                await revokeUserSessions(targetUserId);
                await recordAuthLog({
                    userId: currentUser.id,
                    username: currentUser.username,
                    action: 'REVOKE_USER_SESSIONS',
                    status: 'SUCCESS',
                    ip,
                    userAgent,
                    details: { targetUserId }
                });

                const headers = { 'Content-Type': 'application/json' };
                if (String(targetUserId) === String(currentUser.id)) {
                    headers['Set-Cookie'] = clearSessionCookie(req);
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `User sessions for ID #${targetUserId} have been successfully terminated across all devices.`
                    }),
                    { status: 200, headers }
                );
            }

            await revokeAllSessions();
            await recordAuthLog({
                userId: currentUser.id,
                username: currentUser.username,
                action: 'GLOBAL_LOGOUT_ALL_DEVICES',
                status: 'SUCCESS',
                ip,
                userAgent,
                details: { triggeredBy: currentUser.username }
            });

            const clearCookieHeader = clearSessionCookie(req);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'All active sessions across all devices and users have been terminated.'
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Set-Cookie': clearCookieHeader
                    }
                }
            );
        } catch (err) {
            return serverError(err);
        }
    }

    static async me(req) {
        try {
            const user = await getAuthenticatedUser(req);
            if (!user) {
                const res = unauthorized('Not authenticated', 'NOT_AUTHENTICATED', { authenticated: false, user: null });
                const clearCookieHeader = clearSessionCookie(req);
                res.headers.set('Set-Cookie', clearCookieHeader);
                return res;
            }

            return ok({
                authenticated: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    status: user.status
                }
            });
        } catch (err) {
            return serverError(err);
        }
    }

    static async sendOtp(req) {
        const ip = getClientIp(req);
        const userAgent = getUserAgent(req);

        if (!checkRateLimit(`otp:${ip}`, MAX_OTP_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            return tooManyRequests('Too many OTP requests. Please wait 5 minutes before trying again.');
        }

        try {
            const body = await req.json();
            const rawDestination = body.destination || body.login || body.email || body.phone;
            const requestedChannel = body.channel || 'auto';

            if (!rawDestination || typeof rawDestination !== 'string') {
                return badRequest('Please enter a valid email, phone number, or username.');
            }

            const cleanInput = rawDestination.trim().toLowerCase();

            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: cleanInput },
                        { username: cleanInput },
                        { phone: cleanInput }
                    ]
                }
            });

            if (!user) {
                await recordAuthLog({
                    username: cleanInput,
                    action: 'OTP_REQUEST_FAILED',
                    status: 'FAILED',
                    ip,
                    userAgent,
                    details: { reason: 'User not found', attempted: cleanInput }
                });
                return ok({
                    success: true,
                    message: requestedChannel === 'email' ? 'Verification code sent if account exists.' : 'Verification code sent via Telegram if account exists.',
                    channel: requestedChannel,
                    maskedDestination: requestedChannel === 'email' ? 'registered email' : 'Telegram',
                    targetDestination: cleanInput,
                    expiresIn: 300
                });
            }

            if (user.status === 'suspended') {
                return forbidden('This account is currently suspended. Please contact support.');
            }

            let targetDestination = cleanInput;
            let channelToUse = requestedChannel;

            if (requestedChannel === 'telegram') {
                targetDestination = user.telegram_chat_id || user.phone || cleanInput;
            } else if (requestedChannel === 'email') {
                targetDestination = user.email || cleanInput;
            } else {
                if (cleanInput.includes('@')) {
                    channelToUse = 'email';
                    targetDestination = cleanInput;
                } else if (user.telegram_chat_id) {
                    channelToUse = 'telegram';
                    targetDestination = user.telegram_chat_id;
                } else if (user.email) {
                    channelToUse = 'email';
                    targetDestination = user.email;
                }
            }

            const result = await createAndSendOtp(targetDestination, channelToUse);

            if (!result.success) {
                return serverError(result.error || 'Failed to dispatch verification code.');
            }

            const maskedDest = result.maskedDestination || (channelToUse === 'email' ? 'registered email' : 'Telegram');

            await recordAuthLog({
                userId: user.id,
                username: user.username,
                action: 'OTP_REQUEST_SENT',
                status: 'SUCCESS',
                ip,
                userAgent,
                details: { channel: channelToUse, maskedDestination: maskedDest }
            });

            return ok({
                success: true,
                message: result.message || (channelToUse === 'email' ? `Verification code sent to ${maskedDest}` : 'Verification code sent via Telegram.'),
                channel: channelToUse,
                maskedDestination: maskedDest,
                targetDestination: cleanInput,
                expiresIn: 300
            });
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
