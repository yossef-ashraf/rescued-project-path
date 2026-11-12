import crypto from 'crypto';
import { Setting, User, TodoItem, Task, Notification } from '@/shared/models/index.js';
import { Op } from '@/shared/database/orm.js';
import { getEgyptDateStr, getEgyptTimeStr } from '@/shared/utils/timezone.js';
import { getServerConfig } from '@/shared/config/server-config.js';

let cachedTelegramConfig = null;
let telegramConfigFetchedAt = 0;
const TELEGRAM_CONFIG_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function invalidateTelegramConfigCache() {
    cachedTelegramConfig = null;
    telegramConfigFetchedAt = 0;
}

export async function getTelegramConfig(forceRefresh = false) {
    if (!forceRefresh && cachedTelegramConfig && (Date.now() - telegramConfigFetchedAt < TELEGRAM_CONFIG_TTL_MS)) {
        return cachedTelegramConfig;
    }

    let token = '';
    let chatId = '';

    try {
        const rows = await Setting.findAll({
            attributes: ['key', 'value'],
            where: {
                key: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']
            },
            raw: true
        });

        if (Array.isArray(rows)) {
            for (const r of rows) {
                if (r.key === 'TELEGRAM_BOT_TOKEN' && r.value) token = r.value.trim();
                if (r.key === 'TELEGRAM_CHAT_ID' && r.value) chatId = r.value.trim();
            }
        }

        if (!chatId) {
            const adminUser = await User.findOne({
                attributes: ['telegram_chat_id'],
                where: {
                    telegram_chat_id: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            { [Op.ne]: '' }
                        ]
                    }
                },
                order: [['id', 'ASC']],
                raw: true
            });
            if (adminUser && adminUser.telegram_chat_id) {
                chatId = String(adminUser.telegram_chat_id).trim();
            }
        }

        cachedTelegramConfig = { token, chatId };
        telegramConfigFetchedAt = Date.now();
    } catch (e) {
        console.warn('Failed to read Telegram settings from DB:', e.message);
    }

    return cachedTelegramConfig || { token, chatId };
}

export function getProductionBaseUrl(origin = '') {
    if (origin && origin.startsWith('https://') && !origin.includes('localhost')) {
        return origin.replace(/\/+$/, '');
    }
    const baseUrl = getServerConfig().baseUrl;
    if (baseUrl && baseUrl.startsWith('https://') && !baseUrl.includes('localhost')) {
        return baseUrl.replace(/\/+$/, '');
    }
    return '';
}

/** Secret Telegram echoes in X-Telegram-Bot-Api-Secret-Token on every webhook call. */
export function telegramWebhookSecret(token) {
    return crypto.createHmac('sha256', String(token)).update('orbit-telegram-webhook').digest('hex').slice(0, 64);
}

export async function verifyTelegramWebhookRequest(req) {
    const { token } = await getTelegramConfig(true);
    if (!token) return false;
    const provided = req.headers?.get?.('x-telegram-bot-api-secret-token') || '';
    const expected = telegramWebhookSecret(token);
    if (!provided || provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function ensureTelegramWebhook(customUrl = '') {
    const { token } = await getTelegramConfig();
    if (!token) {
        return { ok: false, error: 'Telegram Bot Token not configured' };
    }

    const targetBase = customUrl || getProductionBaseUrl();
    const webhookUrl = `${targetBase}/api/public/telegram/webhook`;
    const secretToken = telegramWebhookSecret(token);

    try {
        const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const info = await infoRes.json();

        if (info.ok && info.result?.url === webhookUrl && !customUrl) {
            return { ok: true, registered: false, url: webhookUrl, info: info.result };
        }

        const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secretToken,
                allowed_updates: ['message', 'callback_query']
            })
        });

        const setData = await setRes.json();
        return { ok: Boolean(setData.ok), registered: true, url: webhookUrl, result: setData };
    } catch (e) {
        console.error('[ensureTelegramWebhook Error]:', e.message);
        return { ok: false, error: e.message };
    }
}

export async function sendTelegramMessage(text, options = {}) {
    const { token, chatId } = await getTelegramConfig();
    const targetChatId = options.chatId || chatId;

    if (!token) {
        console.warn('[Telegram] Cannot send message: TELEGRAM_BOT_TOKEN is not configured.');
        return { success: false, error: 'Telegram Bot Token not configured' };
    }

    if (!targetChatId) {
        console.warn('[Telegram] Cannot send message: Target Chat ID is not configured.');
        return { success: false, error: 'Telegram Chat ID not found' };
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const payload = {
            chat_id: targetChatId,
            text,
            parse_mode: options.parseMode || 'HTML',
            disable_web_page_preview: options.disablePreview ?? false
        };

        if (options.replyMarkup) {
            payload.reply_markup = options.replyMarkup;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.ok) {
            console.error('[Telegram API Error]', data.description);
            return { success: false, error: data.description };
        }

        return { success: true, messageId: data.result?.message_id };
    } catch (err) {
        console.error('[Telegram Network Error]', err.message);
        return { success: false, error: err.message };
    }
}

export async function answerTelegramCallback(callbackQueryId, text = 'تم!') {
    const { token } = await getTelegramConfig();
    if (!token || !callbackQueryId) return;

    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                show_alert: false
            })
        });
    } catch (e) {
        console.error('[Telegram Callback Error]', e.message);
    }
}

export async function sendTelegramNotification({
    title,
    message,
    itemName = '',
    details = '',
    status = '',
    link,
    type = 'info',
    priority = 'normal',
    origin = '',
    todoId = null,
    taskId = null,
    buttons = null
}) {
    let emoji = '🔔';
    if (type === 'daily_tasks_8am') emoji = '🌅';
    else if (type === 'todo_started') emoji = '🚀';
    else if (type === 'todo_ended') emoji = '⏰';
    else if (type === 'midnight_close_day') emoji = '🌙';
    else if (type === 'debt_alert' || priority === 'urgent') emoji = '⚠️';
    else if (type === 'success') emoji = '✅';
    else if (type === 'courses_reminder' || type === 'learning') emoji = '🎓';

    const baseUrl = getProductionBaseUrl(origin);
    const actionUrl = link ? (link.startsWith('http') ? link : `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`) : '';

    const cairoTimeFormatted = new Intl.DateTimeFormat('ar-EG', {
        timeZone: 'Africa/Cairo',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date());

    let html = `<b>${emoji} ${escapeHtml(title)}</b>\n\n`;
    if (itemName) {
        html += `<b>العنصر:</b> ${escapeHtml(itemName)}\n`;
    }
    const bodyContent = details || message;
    if (bodyContent) {
        html += `<b>التفاصيل:</b> ${escapeHtml(bodyContent)}\n`;
    }
    if (status) {
        html += `<b>الحالة:</b> ${escapeHtml(status)}\n`;
    }
    html += `<b>الوقت:</b> 🕒 ${cairoTimeFormatted} (بتوقيت القاهرة)`;

    let replyMarkup = undefined;
    const keyboard = [];

    const activeId = todoId || taskId;
    const isTask = Boolean(taskId && !todoId);

    if (Array.isArray(buttons) && buttons.length > 0) {
        for (const btn of buttons) {
            keyboard.push([btn]);
        }
    } else if (activeId) {
        const cbData = isTask ? `task_done_${activeId}` : `todo_done_${activeId}`;
        keyboard.push([{ text: '✅ تم الإنجاز', callback_data: cbData }]);
    }

    if (actionUrl && actionUrl.startsWith('https://')) {
        keyboard.push([{ text: '🔗 فتح في لوحة التحكم', url: actionUrl }]);
    }

    if (keyboard.length > 0) {
        replyMarkup = { inline_keyboard: keyboard };
    }

    return sendTelegramMessage(html, { parseMode: 'HTML', replyMarkup });
}

function normalizeArabicText(str = '') {
    return String(str)
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/[!؟?.,،_\-()#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

export async function handleTelegramWebhookUpdate(update) {
    if (!update) return { ok: false, error: 'Empty update' };

    const { token, chatId: defaultChatId } = await getTelegramConfig();

    if (update.callback_query) {
        const cb = update.callback_query;
        const data = String(cb.data || '');
        const chatId = cb.message?.chat?.id || defaultChatId;
        const messageId = cb.message?.message_id;

        if (data === 'already_done') {
            await answerTelegramCallback(cb.id, 'هذه المهمة تم تسجيل إنجازها بالفعل 👍');
            return { ok: true, action: 'already_done' };
        }

        try {
            let targetType = null;
            let targetId = null;

            if (data.startsWith('todo_done_')) {
                targetType = 'todo';
                targetId = data.replace('todo_done_', '').trim();
            } else if (data.startsWith('task_done_')) {
                targetType = 'task';
                targetId = data.replace('task_done_', '').trim();
            } else if (data.startsWith('done_')) {
                targetId = data.replace('done_', '').trim();
            }

            if (!targetId) {
                await answerTelegramCallback(cb.id, 'أمر غير معروف');
                return { ok: true, action: 'ignored_callback' };
            }

            let foundTodo = null;
            let foundTask = null;

            if (targetType === 'todo' || !targetType) {
                foundTodo = await TodoItem.findByPk(targetId).catch(() => null);
            }
            if (!foundTodo && (targetType === 'task' || !targetType)) {
                foundTask = await Task.findByPk(targetId).catch(() => null);
            }

            if (foundTodo) {
                if (foundTodo.done === 1 || foundTodo.done === true) {
                    await answerTelegramCallback(cb.id, `المهمة "${foundTodo.text}" مسجلة كمنجزة بالفعل 👍`);
                    if (token && messageId && chatId) {
                        try {
                            await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    message_id: messageId,
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: '✅ مسجلة كمنجزة بالفعل', callback_data: 'already_done' }]
                                        ]
                                    }
                                })
                            });
                        } catch (_) {}
                    }
                    return { ok: true, action: 'already_done', type: 'todo', id: foundTodo.id };
                }

                foundTodo.done = 1;
                foundTodo.updated_at = new Date();
                await foundTodo.save();

                try {
                    await Notification.update(
                        { is_read: 1 },
                        { where: { link: { [Op.like]: `%/tasks/todo%highlight=${foundTodo.id}%` } } }
                    );
                } catch (_) {}

                await answerTelegramCallback(cb.id, `✅ تم تسجيل "${foundTodo.text}" كمنجزة!`);

                if (token && messageId && chatId) {
                    try {
                        await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: messageId,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '✅ منجزة (Completed)', callback_data: 'already_done' }]
                                    ]
                                }
                            })
                        });
                    } catch (_) {}
                }

                await sendTelegramMessage(
                    `✅ <b>تم الإنجاز بنجاح!</b>\n\nتم تعليم المهمة "<b>${escapeHtml(foundTodo.text)}</b>" كمنجزة في جدول اليوم 🎉\nتقبل الله منك وبارك في وقتك!`,
                    { chatId, parseMode: 'HTML' }
                );
                return { ok: true, action: 'marked_done', type: 'todo', id: foundTodo.id };
            }

            if (foundTask) {
                if (foundTask.status === 'done') {
                    await answerTelegramCallback(cb.id, `المهمة "${foundTask.title}" مسجلة كمنجزة بالفعل 👍`);
                    if (token && messageId && chatId) {
                        try {
                            await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    message_id: messageId,
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{ text: '✅ مسجلة كمنجزة بالفعل', callback_data: 'already_done' }]
                                        ]
                                    }
                                })
                            });
                        } catch (_) {}
                    }
                    return { ok: true, action: 'already_done', type: 'task', id: foundTask.id };
                }

                foundTask.status = 'done';
                foundTask.updated_at = new Date();
                await foundTask.save();

                try {
                    await Notification.update(
                        { is_read: 1 },
                        { where: { link: { [Op.like]: `%/tasks%` } } }
                    );
                } catch (_) {}

                await answerTelegramCallback(cb.id, `✅ تم تسجيل "${foundTask.title}" كمنجزة!`);

                if (token && messageId && chatId) {
                    try {
                        await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                message_id: messageId,
                                reply_markup: {
                                    inline_keyboard: [
                                        [{ text: '✅ منجزة (Completed)', callback_data: 'already_done' }]
                                    ]
                                }
                            })
                        });
                    } catch (_) {}
                }

                await sendTelegramMessage(
                    `✅ <b>تم الإنجاز بنجاح!</b>\n\nتم تعليم المهمة "<b>${escapeHtml(foundTask.title)}</b>" كمنجزة 🎉\nأحسنت وبارك الله في وقتك!`,
                    { chatId, parseMode: 'HTML' }
                );
                return { ok: true, action: 'marked_done', type: 'task', id: foundTask.id };
            }

            await answerTelegramCallback(cb.id, 'عفواً، لم يتم العثور على المهمة أو تم حذفها.');
            return { ok: false, error: 'Item not found' };
        } catch (err) {
            console.error('[Telegram Callback Error]:', err);
            await answerTelegramCallback(cb.id, 'حدث خطأ أثناء حفظ التحديث.');
            return { ok: false, error: err.message };
        }
    }

    if (update.message) {
        const msg = update.message;
        const chatId = msg.chat?.id || defaultChatId;
        const rawText = String(msg.text || '').trim();
        const normText = normalizeArabicText(rawText);

        const positiveKeywords = [
            'يس', 'yes', 'تم', 'تمام', 'done', 'ok', 'ماشي',
            'خلاص', 'خلصت', 'صح', 'اه', 'ايوه', 'ايوة', 'تمت', 'خلصته',
            'صليت', 'قريت', 'قراءه', 'راجعت', 'عملتها', 'خلصنا', 'done!'
        ];

        const isPositive = positiveKeywords.some(kw => 
            normText === kw || 
            normText.startsWith(kw + ' ') || 
            normText.endsWith(' ' + kw) ||
            normText.includes(' ' + kw + ' ')
        );

        if (isPositive) {
            let targetTodo = null;
            let targetTask = null;

            const replyText = msg.reply_to_message?.text || msg.reply_to_message?.caption || '';
            if (replyText) {
                const matchTodo = replyText.match(/\[#todo_(\d+)\]/);
                if (matchTodo && matchTodo[1]) {
                    targetTodo = await TodoItem.findByPk(matchTodo[1]).catch(() => null);
                }
                const matchTask = replyText.match(/\[#task_(\d+)\]/);
                if (!targetTodo && matchTask && matchTask[1]) {
                    targetTask = await Task.findByPk(matchTask[1]).catch(() => null);
                }
            }

            const todayCairo = getEgyptDateStr();

            if (!targetTodo && !targetTask) {
                const pendingToday = await TodoItem.findAll({
                    where: {
                        due_date: { [Op.like]: `${todayCairo}%` },
                        done: 0
                    },
                    order: [['reminder_time', 'ASC']],
                    raw: false
                }).catch(() => []);

                for (const item of pendingToday) {
                    const itemNorm = normalizeArabicText(item.text || '');
                    if (itemNorm && normText.includes(itemNorm)) {
                        targetTodo = item;
                        break;
                    }
                    if (itemNorm.includes('فجر') && normText.includes('فجر')) targetTodo = item;
                    else if (itemNorm.includes('ظهر') && normText.includes('ظهر')) targetTodo = item;
                    else if (itemNorm.includes('عصر') && normText.includes('عصر')) targetTodo = item;
                    else if (itemNorm.includes('مغرب') && normText.includes('مغرب')) targetTodo = item;
                    else if (itemNorm.includes('عشاء') && normText.includes('عشاء')) targetTodo = item;
                    else if (itemNorm.includes('كهف') && (normText.includes('كهف') || normText.includes('جمعه'))) targetTodo = item;
                    else if (itemNorm.includes('قران') && (normText.includes('قران') || normText.includes('ورد'))) targetTodo = item;
                    else if (itemNorm.includes('مراجع') && normText.includes('مراجع')) targetTodo = item;
                    else if ((itemNorm.includes('sw') || itemNorm.includes('study sw')) && normText.includes('sw')) targetTodo = item;
                    else if ((itemNorm.includes('en') || itemNorm.includes('study en')) && normText.includes('en')) targetTodo = item;
                    else if (itemNorm.includes('work') && (normText.includes('work') || normText.includes('شغل'))) targetTodo = item;

                    if (targetTodo) break;
                }

                if (!targetTodo) {
                    const pendingTasks = await Task.findAll({
                        where: {
                            status: { [Op.notIn]: ['done', 'completed'] }
                        },
                        order: [['due_date', 'ASC']],
                        raw: false
                    }).catch(() => []);

                    for (const t of pendingTasks) {
                        const tNorm = normalizeArabicText(t.title || '');
                        if (tNorm && normText.includes(tNorm)) {
                            targetTask = t;
                            break;
                        }
                    }
                }

                if (!targetTodo && !targetTask && pendingToday.length > 0) {
                    const currentTime = getEgyptTimeStr();
                    const pastDue = pendingToday.filter(t => t.reminder_time && t.reminder_time <= currentTime);
                    targetTodo = pastDue.length > 0 ? pastDue[pastDue.length - 1] : pendingToday[0];
                }
            }

            if (targetTodo) {
                targetTodo.done = 1;
                targetTodo.updated_at = new Date();
                await targetTodo.save();

                try {
                    await Notification.update(
                        { is_read: 1 },
                        { where: { link: { [Op.like]: `%/tasks/todo%highlight=${targetTodo.id}%` } } }
                    );
                } catch (_) {}

                await sendTelegramMessage(
                    `✅ <b>تم الإنجاز بنجاح!</b>\n\nتم تعليم المهمة "<b>${escapeHtml(targetTodo.text)}</b>" كمنجزة في جدول اليوم (${todayCairo}) 🎉\nأحسنت وبارك الله في وقتك!`,
                    { chatId, parseMode: 'HTML' }
                );
                return { ok: true, action: 'marked_done_by_text', todoId: targetTodo.id, text: targetTodo.text };
            }

            if (targetTask) {
                targetTask.status = 'done';
                targetTask.updated_at = new Date();
                await targetTask.save();

                try {
                    await Notification.update(
                        { is_read: 1 },
                        { where: { link: { [Op.like]: `%/tasks%` } } }
                    );
                } catch (_) {}

                await sendTelegramMessage(
                    `✅ <b>تم الإنجاز بنجاح!</b>\n\nتم تعليم المهمة "<b>${escapeHtml(targetTask.title)}</b>" كمنجزة 🎉\nأحسنت وبارك الله في وقتك!`,
                    { chatId, parseMode: 'HTML' }
                );
                return { ok: true, action: 'marked_done_by_text', taskId: targetTask.id, title: targetTask.title };
            }

            await sendTelegramMessage(
                `👍 أهلاً بك! تم استلام رسالتك، ولكن جميع مهام اليوم مكتملة بالفعل، أو لم يتم تحديد مهمة معلقة حالياً 🎉`,
                { chatId, parseMode: 'HTML' }
            );
            return { ok: true, action: 'all_done_already' };
        }
    }

    return { ok: true, action: 'ignored' };
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export async function syncTelegramUpdates() {
    const { token } = await getTelegramConfig();
    if (!token) return { ok: false, error: 'No token' };

    // Prevent polling / webhook conflicts in production (requirement 17.20)
    if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TELEGRAM_POLLING_IN_PROD) {
        return { ok: true, processed: 0, skipped: true, reason: 'Polling disabled in production (webhook mode active)' };
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20&timeout=0`);
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
            return { ok: true, processed: 0 };
        }

        let maxUpdateId = 0;
        let processedCount = 0;

        for (const update of data.result) {
            if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
            await handleTelegramWebhookUpdate(update);
            processedCount++;
        }

        if (maxUpdateId > 0) {
            await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${maxUpdateId + 1}&limit=1`);
        }

        return { ok: true, processed: processedCount };
    } catch (e) {
        console.error('[Telegram Sync Error]:', e.message);
        return { ok: false, error: e.message };
    }
}

const telegramService = {
    getTelegramConfig,
    ensureTelegramWebhook,
    sendTelegramMessage,
    sendTelegramNotification,
    answerTelegramCallback,
    handleTelegramWebhookUpdate,
    syncTelegramUpdates
};

export default telegramService;
