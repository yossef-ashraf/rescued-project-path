import { Op } from '@/shared/database/orm.js';
import { Notification, Task, TodoItem, Course, Transaction } from '@/shared/models/index.js';
import { getEgyptDateStr, getEgyptTimeStr } from '@/shared/utils/timezone.js';
import {
    sendTelegramNotification,
    syncTelegramUpdates,
    getTelegramConfig,
    ensureTelegramWebhook
} from '@/features/settings/services/telegram-integration.js';
import { checkAndRunScheduledDatabaseBackup } from '@/features/settings/services/databaseBackupService.js';

let _schemaDone = true;
async function ensureSchema() {
    // Runtime DDL removed. Migrated to app/shared/migrations/2026091804200-add-dedup-key-to-notifications.js
    if (_schemaDone) return;
    _schemaDone = true;
}

let isCycleRunning = false;
let lastCycleTime = 0;
let webhookEnsuredOnce = false;


function normalizeTime(timeStr, defaultTime = '09:00') {
    if (!timeStr) return defaultTime;
    const parts = String(timeStr).trim().split(':');
    if (parts.length >= 2) {
        const h = String(parseInt(parts[0], 10) || 0).padStart(2, '0');
        const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
        return `${h}:${m}`;
    }
    return defaultTime;
}

function calculateEndTime(startStr, durationHours = 0.5) {
    const [h, m] = normalizeTime(startStr).split(':').map(Number);
    const durationMinutes = Math.max(15, Math.round(parseFloat(durationHours || 0.5) * 60));
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    return `${endH}:${endM}`;
}

const inMemoryHandledSlots = new Set();
let lastHandledSlotsDate = '';

function resetSlotsIfNewDay(todayCairo) {
    if (lastHandledSlotsDate !== todayCairo) {
        inMemoryHandledSlots.clear();
        lastHandledSlotsDate = todayCairo;
    }
}

function buildDedupKey(dateStr, type, link = '') {
    return `${dateStr}|${type}|${link}`;
}

async function createNotifOnce({ dateStr, type, title, message, link }) {
    const dedup_key = buildDedupKey(dateStr, type, link);
    if (inMemoryHandledSlots.has(dedup_key)) {
        return { created: false, row: null, dedup_key };
    }
    try {
        const [row, created] = await Notification.findOrCreate({
            where: { dedup_key },
            defaults: { type, title, message, link, is_read: 0, dedup_key, created_at: new Date() }
        });
        inMemoryHandledSlots.add(dedup_key);
        return { created, row, dedup_key };
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError' || err?.parent?.code === 'SQLITE_CONSTRAINT') {
            inMemoryHandledSlots.add(dedup_key);
            return { created: false, row: null, dedup_key };
        }
        throw err;
    }
}


export async function runReminderCycle({ force = false, origin = '', fromCron = false } = {}) {
    if (isCycleRunning && !force) {
        return { skipped: true, reason: 'Cycle already running' };
    }

    isCycleRunning = true;
    lastCycleTime = Date.now();

    try {
        await ensureSchema();
        if (!webhookEnsuredOnce || force) {
            await ensureTelegramWebhook(origin).then(() => {
                webhookEnsuredOnce = true;
            }).catch(err => {
                console.warn('[ReminderScheduler] Webhook ensure error:', err?.message);
            });
        }

        await syncTelegramUpdates().catch(err => {
            console.warn('[ReminderScheduler] Telegram sync error:', err?.message);
        });

        const todayCairo = getEgyptDateStr();
        const timeCairo = getEgyptTimeStr();
        const [cairoHourStr] = timeCairo.split(':');
        const cairoHour = parseInt(cairoHourStr, 10);

        resetSlotsIfNewDay(todayCairo);

        const createdNotifications = [];
        let telegramSentCount = 0;
        const MAX_TELEGRAM_PER_CYCLE = 5;

        const rawTodos = await TodoItem.findAll({
            where: {
                [Op.or]: [
                    { due_date: { [Op.like]: `${todayCairo}%` } },
                    { due_date: null, start_date: { [Op.like]: `${todayCairo}%` } }
                ]
            },
            order: [['reminder_time', 'ASC'], ['id', 'ASC']],
            raw: true
        });

        const todosToday = (rawTodos || []).filter(td => {
            const d = td.due_date ? String(td.due_date).slice(0, 10) : '';
            const s = td.start_date ? String(td.start_date).slice(0, 10) : '';
            return d === todayCairo || s === todayCairo;
        });

        // Batch pre-fetch all existing dedup_keys in ONE single query instead of N individual queries
        const candidateKeys = [];
        for (const todo of todosToday) {
            if (Number(todo.done) === 1) continue;
            const exactLink = `/tasks/todo?highlight=${todo.id}`;
            candidateKeys.push(buildDedupKey(todayCairo, 'todo_started', exactLink));
            candidateKeys.push(buildDedupKey(todayCairo, 'todo_ended', exactLink));
        }

        const keysToFetch = candidateKeys.filter(k => !inMemoryHandledSlots.has(k));
        if (keysToFetch.length > 0) {
            try {
                const existingRows = await Notification.findAll({
                    where: { dedup_key: keysToFetch },
                    attributes: ['dedup_key'],
                    raw: true
                });
                (existingRows || []).forEach(r => {
                    if (r.dedup_key) inMemoryHandledSlots.add(r.dedup_key);
                });
            } catch (_) {}
        }

        for (const todo of todosToday) {
            if (Number(todo.done) === 1) continue;
            if (telegramSentCount >= MAX_TELEGRAM_PER_CYCLE) break;

            const rTime = normalizeTime(todo.reminder_time, '09:00');
            const duration = parseFloat(todo.duration_hours || 0.5);
            const endTime = calculateEndTime(rTime, duration);
            const exactLink = `/tasks/todo?highlight=${todo.id}`;

            const isStartDue = rTime <= timeCairo;
            const isEndDue = endTime <= timeCairo;

            if (isStartDue && !isEndDue) {
                const [rH, rM] = rTime.split(':').map(Number);
                const [cH, cM] = timeCairo.split(':').map(Number);
                const minutesLate = (cH * 60 + cM) - (rH * 60 + rM);

                const title = minutesLate > 180
                    ? `⏰ تذكير مهمة معلقة: ${todo.text || 'مهمة'}`
                    : `🚀 حان موعد مهمة: ${todo.text || 'مهمة جديدة'}`;
                const message = minutesLate > 180
                    ? `الـ To-Do "${todo.text || 'مهمة'}" كان موعدها (${rTime}) ولم تُنجز بعد. هل قمت بإنجازها؟ اضغط أدناه أو رد بـ "يس" أو "تم".`
                    : `الـ To-Do "${todo.text || 'مهمة'}" حان موعد بدئها (${rTime})! اضغط لتسجيلها كمنجزة، أو رد بـ "يس" أو "تم".`;

                const { created } = await createNotifOnce({
                    dateStr: todayCairo,
                    type: 'todo_started',
                    title, message,
                    link: exactLink
                });

                if (created) {
                    const tgRes = await sendTelegramNotification({
                        title,
                        message,
                        itemName: todo.text || 'مهمة اليوم',
                        details: message,
                        status: 'بدأت الآن',
                        link: exactLink,
                        type: 'todo_started',
                        priority: 'normal',
                        origin,
                        todoId: todo.id
                    }).catch(() => ({ success: false }));

                    if (tgRes?.success) telegramSentCount++;
                    createdNotifications.push({ type: 'todo_started', id: todo.id, title, telegramSent: Boolean(tgRes?.success) });
                }
                continue;
            }

            if (isEndDue) {
                const title = `⏰ انتهى وقت المهمة: ${todo.text || 'مهمة'}`;
                const message = `الـ To-Do "${todo.text || 'مهمة'}" انقضت مدتها (${duration} ساعة). هل تم إنجازها؟ اضغط لتسجيلها كمنجزة.`;

                const { created } = await createNotifOnce({
                    dateStr: todayCairo,
                    type: 'todo_ended',
                    title, message,
                    link: exactLink
                });

                if (created) {
                    const tgRes = await sendTelegramNotification({
                        title,
                        message,
                        itemName: todo.text || 'مهمة اليوم',
                        details: message,
                        status: 'انتهت الفترة المحددة',
                        link: exactLink,
                        type: 'todo_ended',
                        priority: 'high',
                        origin,
                        todoId: todo.id
                    }).catch(() => ({ success: false }));

                    if (tgRes?.success) telegramSentCount++;
                    createdNotifications.push({ type: 'todo_ended', id: todo.id, title, telegramSent: Boolean(tgRes?.success) });
                }
            }
        }

        if ((cairoHour >= 8 && cairoHour < 15) || force) {
            const title_key = 'daily_tasks_reminder';
            const slotKey = buildDedupKey(todayCairo, title_key, '/tasks');
            const shouldCheck = !inMemoryHandledSlots.has(slotKey) || force;

            if (shouldCheck) {
                const existing = await Notification.findOne({
                    where: { dedup_key: slotKey },
                    attributes: ['id'],
                    raw: true
                });

                if (existing && !force) {
                    inMemoryHandledSlots.add(slotKey);
                } else {
                    const pendingTasks = await Task.findAll({
                        where: { status: { [Op.notIn]: ['done', 'completed'] } },
                        order: [['due_date', 'ASC']],
                        raw: true
                    });

                    const todayTasks = pendingTasks.filter(task => {
                        const d = task.due_date ? String(task.due_date).slice(0, 10) : '';
                        const s = task.start_date ? String(task.start_date).slice(0, 10) : '';
                        return d === todayCairo || s === todayCairo || (d && d < todayCairo);
                    });

                    if (todayTasks.length > 0) {
                        const title = `📋 تذكير التاسكات: لديك (${todayTasks.length}) مهمة مستحقة`;
                        const taskTitles = todayTasks.slice(0, 4).map(t => `• ${t.title}`).join('\n');
                        const greeting = cairoHour < 12 ? 'صباح الخير!' : (cairoHour < 17 ? 'مساء الخير!' : 'تذكير المهام:');
                        const message = `${greeting} لديك ${todayTasks.length} مهمة تحتاج لمتابعتك اليوم:\n${taskTitles}${todayTasks.length > 4 ? '\n• والمزيد...' : ''}\nاضغط لمتابعة وإنجاز المهام.`;

                        if (existing) {
                            await Notification.update({ title, message }, { where: { dedup_key: slotKey } });
                        } else {
                            await Notification.create({
                                type: title_key,
                                title,
                                message,
                                link: '/tasks',
                                is_read: 0,
                                dedup_key: slotKey,
                                created_at: new Date()
                            });
                        }
                        inMemoryHandledSlots.add(slotKey);

                        const taskButtons = todayTasks.slice(0, 3).map(t => ({
                            text: `✅ إنجاز: ${t.title.slice(0, 22)}`,
                            callback_data: `task_done_${t.id}`
                        }));

                        const tgRes = await sendTelegramNotification({
                            title, message,
                            link: '/tasks',
                            type: 'daily_tasks_8am',
                            priority: 'high',
                            origin,
                            buttons: taskButtons
                        }).catch(() => ({ success: false }));

                        if (tgRes?.success) telegramSentCount++;
                        createdNotifications.push({ type: title_key, title, telegramSent: Boolean(tgRes?.success) });
                    } else {
                        inMemoryHandledSlots.add(slotKey);
                    }
                }
            }
        }

        if ((cairoHour >= 16 && cairoHour < 22) || force) {
            const slotKey = buildDedupKey(todayCairo, 'courses_reminder', '/courses');
            const shouldCheck = !inMemoryHandledSlots.has(slotKey) || force;

            if (shouldCheck) {
                const existing = await Notification.findOne({
                    where: { dedup_key: slotKey },
                    attributes: ['id'],
                    raw: true
                });

                if (existing && !force) {
                    inMemoryHandledSlots.add(slotKey);
                } else {
                    const activeCourses = await Course.findAll({
                        where: { status: { [Op.ne]: 'completed' } },
                        order: [['id', 'DESC']],
                        limit: 5,
                        raw: true
                    });

                    if (activeCourses.length > 0) {
                        const courseList = activeCourses.slice(0, 3).map(c => `• ${c.title} (${c.progress_percentage || 0}%)`).join('\n');
                        const title = `🎓 تذكير الكورسات: وقت المذاكرة والتعلم!`;
                        const message = `لديك ${activeCourses.length} كورس قيد التقدم:\n${courseList}\nخصص 30-60 دقيقة اليوم لإنجاز وحدات جديدة.`;

                        if (existing) {
                            await Notification.update({ title, message }, { where: { dedup_key: slotKey } });
                        } else {
                            await Notification.create({
                                type: 'courses_reminder',
                                title,
                                message,
                                link: '/courses/hierarchy',
                                is_read: 0,
                                dedup_key: slotKey,
                                created_at: new Date()
                            });
                        }
                        inMemoryHandledSlots.add(slotKey);

                        const tgRes = await sendTelegramNotification({
                            title,
                            message,
                            itemName: 'مصفوفة الكورسات والتعلم (Evolution)',
                            details: `لديك ${activeCourses.length} كورس قيد التقدم:\n${courseList}\nخصص 30-60 دقيقة اليوم لإنجاز وحدات جديدة.`,
                            status: 'قيد التقدم',
                            link: '/courses/hierarchy',
                            type: 'courses_reminder',
                            priority: 'normal',
                            origin
                        }).catch(() => ({ success: false }));

                        if (tgRes?.success) telegramSentCount++;
                        createdNotifications.push({ type: 'courses_reminder', title, telegramSent: Boolean(tgRes?.success) });
                    } else {
                        inMemoryHandledSlots.add(slotKey);
                    }
                }
            }
        }

        if ((cairoHour >= 20 && cairoHour <= 23) || (force && cairoHour >= 18)) {
            const slotKey = buildDedupKey(todayCairo, 'daily_finance_reminder', '/financial-reports');
            const shouldCheck = !inMemoryHandledSlots.has(slotKey) || force;

            if (shouldCheck) {
                const existing = await Notification.findOne({
                    where: { dedup_key: slotKey },
                    attributes: ['id'],
                    raw: true
                });

                if (existing && !force) {
                    inMemoryHandledSlots.add(slotKey);
                } else {
                    const todayTransactions = await Transaction.findAll({
                        where: { transaction_date: { [Op.like]: `${todayCairo}%` } },
                        attributes: ['id'],
                        limit: 1,
                        raw: true
                    });

                    if (!todayTransactions || todayTransactions.length === 0) {
                        const title = `💰 تذكير فلوس اليوم: لم تسجل مصاريفك بعد!`;
                        const message = `تذكير يومي (${todayCairo}): لم يتم تسجيل أي مصاريف أو دخل لليوم حتى الآن.\nسجل معاملات اليوم المالية لحفظ الميزانية.`;

                        if (existing) {
                            await Notification.update({ title, message }, { where: { dedup_key: slotKey } });
                        } else {
                            await Notification.create({
                                type: 'daily_finance_reminder',
                                title,
                                message,
                                link: '/financial-reports',
                                is_read: 0,
                                dedup_key: slotKey,
                                created_at: new Date()
                            });
                        }
                        inMemoryHandledSlots.add(slotKey);

                        const tgRes = await sendTelegramNotification({
                            title, message,
                            link: '/financial-reports',
                            type: 'debt_alert',
                            priority: 'high',
                            origin
                        }).catch(() => ({ success: false }));

                        if (tgRes?.success) telegramSentCount++;
                        createdNotifications.push({ type: 'daily_finance_reminder', title, telegramSent: Boolean(tgRes?.success) });
                    } else {
                        inMemoryHandledSlots.add(slotKey);
                    }
                }
            }
        }

        if (cairoHour === 0 || cairoHour === 23 || (force && (cairoHour >= 23 || cairoHour === 0))) {
            const slotKey = buildDedupKey(todayCairo, 'midnight_close_day', '/financial-reports');
            const shouldCheck = !inMemoryHandledSlots.has(slotKey) || force;

            if (shouldCheck) {
                const existing = await Notification.findOne({
                    where: { dedup_key: slotKey },
                    attributes: ['id'],
                    raw: true
                });

                if (existing && !force) {
                    inMemoryHandledSlots.add(slotKey);
                } else {
                    const title = `🌙 تقفيل اليوم: الحساب المالي والمهام`;
                    const message = `تنبيه منتصف الليل: حان وقت مراجعة وتقفيل الحساب المالي وتحديث حالة الـ ToDos والـ Tasks لليوم!`;

                    if (existing) {
                        await Notification.update({ title, message }, { where: { dedup_key: slotKey } });
                    } else {
                        await Notification.create({
                            type: 'midnight_close_day',
                            title,
                            message,
                            link: '/financial-reports',
                            is_read: 0,
                            dedup_key: slotKey,
                            created_at: new Date()
                        });
                    }
                    inMemoryHandledSlots.add(slotKey);

                    const tgRes = await sendTelegramNotification({
                        title: `🌙 تقفيل اليوم: الحساب المالي والمهام`,
                        message: `تنبيه منتصف الليل: حان وقت مراجعة وتقفيل الحساب المالي وتحديث حالة الـ ToDos والـ Tasks لليوم! اضغط لإتمام التقفيل.`,
                        link: '/financial-reports',
                        type: 'midnight_close_day',
                        priority: 'high',
                        origin
                    }).catch(() => ({ success: false }));

                    if (tgRes?.success) telegramSentCount++;
                    createdNotifications.push({ type: 'midnight_close_day', telegramSent: Boolean(tgRes?.success) });
                }
            }
        }

        const backupCheck = await checkAndRunScheduledDatabaseBackup({ fromCron }).catch(err => ({
            triggered: false,
            error: err?.message
        }));

        const { token: tgToken, chatId: tgChatId } = await getTelegramConfig();

        return {
            success: true,
            date: todayCairo,
            time: timeCairo,
            cairoHour,
            telegramConfigured: Boolean(tgToken && tgChatId),
            telegramSentCount,
            notificationsCreated: createdNotifications.length,
            items: createdNotifications,
            databaseBackup: backupCheck
        };
    } catch (err) {
        console.error('[ReminderScheduler Error]:', err);
        return { success: false, error: err.message };
    } finally {
        isCycleRunning = false;
    }
}

const SCHEDULER_KEY = Symbol.for('__theRootReminderSchedulerStarted__');

export function startReminderScheduler(intervalMs = 15 * 60 * 1000) {
    if (globalThis[SCHEDULER_KEY]) return;
    globalThis[SCHEDULER_KEY] = true;

    console.log('[ReminderScheduler] Starting background reminder loop every', intervalMs / 60000, 'min');

    setTimeout(() => {
        runReminderCycle().catch(err => {
            console.error('[ReminderScheduler] Initial run error:', err?.message);
        });
    }, 15_000);

    const id = setInterval(() => {
        runReminderCycle().catch(err => {
            console.error('[ReminderScheduler] Periodic run error:', err?.message);
        });
    }, intervalMs);

    if (id?.unref) id.unref();
}

export async function triggerThrottledReminderCheck(minIntervalMs = 15 * 60 * 1000) {
    const now = Date.now();
    if (now - lastCycleTime > minIntervalMs && !isCycleRunning) {
        return runReminderCycle();
    }
    return { skipped: true, reason: 'Throttled' };
}
