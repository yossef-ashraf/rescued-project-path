import { NotificationsController } from '@/features/notifications/controllers/NotificationsController.js';

export const notificationsRoutes = {
  'notifications': {
    GET: (req) => NotificationsController.getNotifications(req),
    POST: (req) => NotificationsController.handleAction(req),
    PUT: (req) => NotificationsController.handleAction(req),
    PATCH: (req) => NotificationsController.handleAction(req),
    DELETE: (req) => NotificationsController.handleAction(req)
  }
};
