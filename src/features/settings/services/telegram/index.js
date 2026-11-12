/**
 * Telegram Feature Module
 * Orbit Architecture v2
 */

import templates from './templates';
import { sendTelegramPayload } from './transport';
import { getTelegramConfig } from '@/features/settings/services/telegram-integration.js';

export { templates, sendTelegramPayload };

export async function sendTelegramNotification(text, options = {}) {
    const config = await getTelegramConfig();
    if (!config?.token || !config?.chatId) {
        return {
            sent: false,
            reason: 'Telegram is not configured'
        };
    }

    try {
        const result = await sendTelegramPayload(config.token, config.chatId, text, options);
        return {
            sent: true,
            messageId: result.messageId
        };
    } catch (err) {
        console.error('[Telegram] Delivery failed:', err?.message);
        return {
            sent: false,
            error: err?.message
        };
    }
}

const serviceExports = {
    templates,
    sendTelegramPayload,
    sendTelegramNotification
};

export default serviceExports;
