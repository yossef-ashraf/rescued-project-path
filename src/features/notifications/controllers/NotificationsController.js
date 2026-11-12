import { Notification } from '@/shared/models/index.js';
import { requireAuth, ok, badRequest, unauthorized, serverError } from '@/shared/utils/response.js';

const NOTIFICATIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateNotificationsCache() {
    globalThis.__codexNotifCache__ = null;
    globalThis.__codexNotifCacheTime__ = 0;
}

export class NotificationsController {
    static async getNotifications(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const cached = globalThis.__codexNotifCache__;
            const cacheTime = globalThis.__codexNotifCacheTime__ || 0;
            if (cached && (Date.now() - cacheTime < NOTIFICATIONS_CACHE_TTL_MS)) {
                return ok(cached);
            }

            const notifications = await Notification.findAll({
                order: [['id', 'DESC']],
                limit: 50,
                raw: true
            });

            const unreadCount = (notifications || []).filter(n => n.is_read === 0 || !n.is_read).length;

            const payload = { notifications: notifications || [], unreadCount };
            globalThis.__codexNotifCache__ = payload;
            globalThis.__codexNotifCacheTime__ = Date.now();

            return ok(payload);
        } catch (err) {
            if (globalThis.__codexNotifCache__) return ok(globalThis.__codexNotifCache__);
            return serverError(err);
        }
    }

    static async handleAction(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            invalidateNotificationsCache();

            const body = await req.json();
            const { action, id } = body;
            const targetId = id || body.notificationId;

            if (action === 'mark_read' || action === 'mark_all_read' || action === 'read') {
                if (targetId) {
                    await Notification.update({ is_read: 1 }, { where: { id: targetId } });
                } else {
                    await Notification.update({ is_read: 1 }, { where: { is_read: 0 } });
                }
                return ok({ success: true });
            }

            if (action === 'delete_notification' || action === 'delete' || action === 'delete_all' || action === 'clear_all') {
                if (targetId) {
                    await Notification.destroy({ where: { id: targetId } });
                } else if (action === 'delete_all' || action === 'clear_all') {
                    await Notification.destroy({ where: {} });
                }
                return ok({ success: true });
            }

            return badRequest('Invalid action');
        } catch (err) {
            return serverError(err);
        }
    }
}

export default NotificationsController;
