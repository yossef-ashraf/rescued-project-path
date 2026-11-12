import { CronController } from '@/features/settings/controllers/CronController.js';

export const cronRoutes = {
  'cron/notifications': {
    GET: (req) => CronController.handleNotifications(req),
    POST: (req) => CronController.handleNotifications(req)
  },
  'cron/db-backup': {
    GET: (req) => CronController.handleDatabaseBackup(req),
    POST: (req) => CronController.handleDatabaseBackup(req)
  },
  'cron/telegram-webhook': {
    GET: (req) => CronController.handleTelegramWebhook(req),
    POST: (req) => CronController.handleTelegramWebhook(req)
  },
  'telegram/webhook': {
    GET: (req) => CronController.handleTelegramWebhook(req),
    POST: (req) => CronController.handleTelegramWebhook(req)
  }
};
