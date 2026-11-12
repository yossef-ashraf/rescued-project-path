/**
 * Telegram Message Templates
 * Section 34.5 — Orbit Architecture v2
 */

export function renderDailySummary({ date, tasksCount, completedCount, pendingCount, habitsProgress }) {
    return `📊 *ملخص اليوم — Orbit* (${date || new Date().toISOString().slice(0, 10)})
━━━━━━━━━━━━━━━━━━━━
✅ المهام المنجزة: ${completedCount || 0}
⏳ المهام المتبقية: ${pendingCount || 0}
📌 إجمالي المهام: ${tasksCount || 0}
${habitsProgress ? `🌱 التقدم: ${habitsProgress}%\n` : ''}
أتمنى لك يوماً مثمراً وموفقاً! 🚀`;
}

export function renderBackupNotification({ success, timestamp, details }) {
    if (success) {
        return `💾 *النسخ الاحتياطي التلقائي — نجاح*
━━━━━━━━━━━━━━━━━━━━
⏰ الوقت: ${timestamp || new Date().toLocaleString('ar-EG')}
✅ تم إنشاء النسخة الاحتياطية وتأمينها بنجاح.`;
    }
    return `🚨 *تنبيه: فشل النسخ الاحتياطي — Orbit*
━━━━━━━━━━━━━━━━━━━━
⏰ الوقت: ${timestamp || new Date().toLocaleString('ar-EG')}
❌ تفاصيل الخطأ: ${details || 'غير معروف'}`;
}

export function renderReminderNotification({ title, dueTime, description }) {
    return `🔔 *تذكير مهمة — Orbit*
━━━━━━━━━━━━━━━━━━━━
📌 *${title}*
${dueTime ? `⏰ الموعد: ${dueTime}\n` : ''}${description ? `📝 التفاصيل: ${description}` : ''}`;
}

export function renderSystemAlert({ level = 'WARNING', message, component }) {
    const icon = level === 'CRITICAL' ? '🔥' : '⚠️';
    return `${icon} *تنبيه نظام — Orbit [${level}]*
━━━━━━━━━━━━━━━━━━━━
📍 المكون: ${component || 'System'}
💬 الرسالة: ${message}
⏰ الوقت: ${new Date().toLocaleString('ar-EG')}`;
}

const serviceExports = {
    renderDailySummary,
    renderBackupNotification,
    renderReminderNotification,
    renderSystemAlert
};

export default serviceExports;
