"use client";


export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('Browser does not support notifications.');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export async function sendBrowserNotification({ title, body, icon = '/icons/icon-192.png', url = '/tasks/todo', tag = null }) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
    }

    const notifTag = tag || `codex-alert-${title.slice(0, 30)}`;

    const options = {
        body,
        icon,
        badge: '/icons/icon-72.png',
        tag: notifTag,
        renotify: false,
        vibrate: [200, 100, 200],
        data: { url }
    };

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.showNotification) {
                registration.showNotification(title, options);
                return;
            }
        } catch (e) {
            console.warn('SW notification fallback to window Notification:', e);
        }
    }

    try {
        const notif = new Notification(title, options);
        notif.onclick = () => {
            window.focus();
            window.location.href = url;
            notif.close();
        };
    } catch (e) {
        console.error('Error triggering browser notification:', e);
    }
}

let pollerInterval = null;
let cachedReminderTasks = null;
let cachedReminderNotes = null;
let lastReminderDataFetch = 0;
const REMINDER_DATA_TTL_MS = 15 * 60 * 1000;

export function startNotificationPoller() {
    if (typeof window === 'undefined') return;

    if (pollerInterval) clearInterval(pollerInterval);

    const checkReminders = async () => {
        if (Notification.permission !== 'granted') return;
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentDateStr = now.toISOString().split('T')[0];

        const savedMorningTime = localStorage.getItem('morning_summary_time') || '08:00';
        const lastSummaryDate = localStorage.getItem('last_morning_summary_date');
        const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';

        if (!cachedReminderTasks || !cachedReminderNotes || (Date.now() - lastReminderDataFetch > REMINDER_DATA_TTL_MS)) {
            try {
                const [tRes, nRes] = await Promise.all([
                    fetch('/api/tasks'),
                    fetch('/api/notes')
                ]);
                if (tRes.ok) {
                    const tData = await tRes.json();
                    cachedReminderTasks = tData.tasks || [];
                }
                if (nRes.ok) {
                    const nData = await nRes.json();
                    cachedReminderNotes = nData.notes || [];
                }
                lastReminderDataFetch = Date.now();
            } catch (e) {
                return;
            }
        }

        if (notificationsEnabled && currentTimeStr === savedMorningTime && lastSummaryDate !== currentDateStr) {
            const todoCount = (cachedReminderTasks || []).filter(t => t.status === 'todo').length;
            sendBrowserNotification({
                title: '🌅 بداية يوم جديد في ME!',
                body: todoCount > 0
                    ? `لديك ${todoCount} مهام مطلوبة اليوم، ابدأ يومك بإنجازها!`
                    : `لا توجد مهام متأخرة اليوم، استمتع ليومك!`,
                url: '/tasks/todo',
                tag: `morning-summary-${currentDateStr}`
            });
            localStorage.setItem('last_morning_summary_date', currentDateStr);
        }

        const notifiedKey = `reminders_notified_${currentDateStr}_${currentTimeStr}`;
        if (!localStorage.getItem(notifiedKey)) {
            (cachedReminderTasks || []).forEach(t => {
                if (t.reminder_time === currentTimeStr && t.status !== 'done') {
                    sendBrowserNotification({
                        title: `⏰ تنبيه مهمة: ${t.title}`,
                        body: t.description || `حان موعد إنجاز المهمة (${t.reminder_time})`,
                        url: '/tasks/todo',
                        tag: `task-${t.id}-${currentTimeStr}`
                    });
                }
            });

            (cachedReminderNotes || []).forEach(n => {
                if (n.reminder_time === currentTimeStr) {
                    sendBrowserNotification({
                        title: `📝 تنبيه ملاحظة: ${n.title}`,
                        body: n.content ? n.content.substring(0, 100) : `تذكير بملاحظتك (${n.reminder_time})`,
                        url: '/notes',
                        tag: `note-${n.id}-${currentTimeStr}`
                    });
                }
            });

            localStorage.setItem(notifiedKey, 'true');
        }
    };

    checkReminders();
    pollerInterval = setInterval(checkReminders, 60000);
}
