import { Setting } from '@/shared/models/index.js';
import { 
    sendTelegramMessage, 
    getTelegramConfig, 
    ensureTelegramWebhook, 
    handleTelegramWebhookUpdate,
    verifyTelegramWebhookRequest
} from '@/features/settings/services/telegram-integration.js';
import { runReminderCycle } from '@/features/settings/services/reminderScheduler.js';
import {
    runDatabaseDriveBackup,
    checkAndRunScheduledDatabaseBackup,
    cleanupOldDriveDatabaseBackups,
    getDatabaseBackupStatus
} from '@/features/settings/services/databaseBackupService.js';
import { requireAuth, ok, unauthorized, serverError } from '@/shared/utils/response.js';
import { getServerConfig } from '@/shared/config/server-config.js';
import { getRequestContext } from '@/shared/database/db-context.server.js';

async function isAuthorizedCron(req, user) {
    // Signed-in admins can trigger jobs from the app; scheduled calls are verified by the public
    // cron route (managed schedule credential or the CRON_SECRET secret) before reaching here.
    if (user && user.role === 'admin') return true;
    const ctx = getRequestContext();
    return Boolean(ctx?.verifiedSystemCaller);
}

export class CronController {
    static async handleNotifications(req) {
        try {
            let user = null;
            try {
                user = await requireAuth(req);
            } catch (_) {}

            const authorized = await isAuthorizedCron(req, user);
            if (!authorized) {
                return unauthorized('Unauthorized: Valid cron secret or admin session required.');
            }

            const host = req.headers?.get?.('x-forwarded-host') || req.headers?.get?.('host') || '';
            const proto = req.headers?.get?.('x-forwarded-proto') || 'https';
            const reqOrigin = (host && !host.includes('localhost')) 
                ? `${proto}://${host}` 
                : (getServerConfig().baseUrl || '');

            await ensureTelegramWebhook(reqOrigin).catch(err => {
                console.warn('[Cron] ensureWebhook warning:', err?.message);
            });

            const { searchParams } = new URL(req.url);
            const force = searchParams.get('force') === 'true';
            const isTestTelegram = searchParams.get('test_telegram') === 'true';

            const { token: tgToken, chatId: tgChatId } = await getTelegramConfig();

            if (isTestTelegram) {
                const nowStr = `${new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date())} بتوقيت القاهرة`;
                const testResult = await sendTelegramMessage(
                    `🔔 <b>تجربة إشعارات ME والتليجرام</b>\n\nنظام الإشعارات متصل بنجاح مع هاتفك! جميع تنبيهات المهام والـ To-Dos ومصاريف اليوم ستصلك هنا فوراً مع أزرار الإنجاز وإمكانية الرد بـ "يس".\n\n<i>🕒 ${nowStr} | The Root Bot</i>`
                );
                return ok({
                    success: testResult.success,
                    telegramConfigured: Boolean(tgToken && tgChatId),
                    chatId: tgChatId ? `${tgChatId.slice(0, 4)}***` : null,
                    telegramResult: testResult
                });
            }

            const cycleResult = await runReminderCycle({ force, origin: reqOrigin, fromCron: true });

            return ok(cycleResult);
        } catch (err) {
            console.error('[CronController Error]:', err);
            return serverError(err);
        }
    }

    static async handleDatabaseBackup(req) {
        try {
            let user = null;
            try {
                user = await requireAuth(req);
            } catch (_) {}

            const authorized = await isAuthorizedCron(req, user);
            if (!authorized) {
                return unauthorized('Unauthorized: Valid cron secret or admin session required.');
            }

            const { searchParams } = new URL(req.url);
            const action = searchParams.get('action') || '';
            const force = searchParams.get('force') === 'true' || searchParams.get('run') === 'true';
            const slotLabel = searchParams.get('slot') || (force ? 'MANUAL_CRON' : 'SCHEDULED');

            if (action === 'status') {
                const status = await getDatabaseBackupStatus();
                return ok(status);
            }

            if (action === 'cleanup') {
                const retentionDays = parseFloat(searchParams.get('days') || '2') || 2;
                const cleanup = await cleanupOldDriveDatabaseBackups({ retentionDays });
                return ok({ success: true, cleanup });
            }

            // Scheduled runs (POST {"scheduled": true}) follow the backup schedule saved in settings, as the original daily cron did.
            let scheduledCall = false;
            if (req.method === 'POST') {
                try { scheduledCall = Boolean((await req.clone().json())?.scheduled); } catch { scheduledCall = false; }
            }

            if (force || (req.method === 'POST' && !scheduledCall)) {
                const backupResult = await runDatabaseDriveBackup({
                    slotLabel,
                    retentionDays: 2,
                    notifyTelegram: true
                });
                return ok(backupResult);
            }

            const scheduledResult = await checkAndRunScheduledDatabaseBackup({ fromCron: true });
            return ok(scheduledResult);
        } catch (err) {
            console.error('[Cron DB Backup Error]:', err);
            return serverError(err);
        }
    }

    static async handleTelegramWebhook(req) {
        try {
            if (req.method === 'GET') {
                const url = new URL(req.url);
                const host = req.headers?.get?.('x-forwarded-host') || req.headers?.get?.('host') || '';
                const proto = req.headers?.get?.('x-forwarded-proto') || 'https';
                const currentOrigin = (host && !host.includes('localhost')) ? `${proto}://${host}` : `${url.protocol}//${url.host}`;

                if (url.searchParams.get('setup') === 'true' || url.searchParams.get('register') === 'true') {
                    const caller = await requireAuth(req).catch(() => null);
                    if (!caller || caller.role !== 'admin') return unauthorized('Admin session required.');
                    const setupResult = await ensureTelegramWebhook(currentOrigin);
                    return ok({ ok: true, status: 'Telegram webhook configured', setupResult });
                }
                return ok({ ok: true, status: 'Telegram webhook active' });
            }
            if (!(await verifyTelegramWebhookRequest(req))) {
                return unauthorized('Invalid Telegram webhook secret.');
            }
            const body = await req.json().catch(() => ({}));
            const result = await handleTelegramWebhookUpdate(body);
            return ok(result);
        } catch (err) {
            console.error('[Telegram Webhook Error]:', err);
            return serverError(err);
        }
    }
}

export default CronController;
