'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import { Bell, CheckCheck, RefreshCw, Clock, ExternalLink, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { useNotifications } from '@/shared/hooks/useNotifications.js';
import { useApp } from '@/shared/context/AppContext.js';

const TYPE_ICONS = {
    info: Info,
    success: CheckCircle2,
    warning: ShieldAlert,
    error: ShieldAlert,
    debt_alert: ShieldAlert,
    daily_tasks_8am: Clock,
    todo_started: Clock,
    todo_ended: CheckCircle2,
    midnight_close_day: Clock
};

const emptySubscribe = () => () => {};

export default function SettingsActivityTimeline() {
    const { t } = useApp();
    const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

    

    const {
        notifications,
        status,
        unreadCount,
        refresh,
        markAsRead,
        markAllAsRead
    } = useNotifications({ limit: 8 });

    const isLoading = mounted && status === 'loading' && notifications.length === 0;

    return (
        <section
            className="settings-activity-timeline p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] shadow-xs space-y-5"
            aria-label={t('Activity & Notifications Timeline', 'الجدول الزمني للأنشطة والإشعارات')}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>{t('Recent Activity Timeline', 'سجل النشاط والإشعارات الأخيرة')}</span>
                            {mounted && unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-500">
                                    {unreadCount} {t('new', 'جديد')}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {t('Audit log and notification events across your workspaces.', 'متابعة تدقيق وتحديثات النظام وإشعارات المهام.')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => refresh(true)}
                        className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                        title={t('Refresh', 'تحديث')}
                        aria-label={t('Refresh timeline', 'تحديث الجدول')}
                    >
                        <RefreshCw className={`w-4 h-4 ${mounted && status === 'loading' ? 'animate-spin' : ''}`} />
                    </button>
                    {mounted && unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={() => markAllAsRead()}
                            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>{t('Mark all read', 'تحديد الكل كمقروء')}</span>
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400 text-xs animate-pulse">
                    <Clock className="w-6 h-6 animate-spin text-zinc-500" />
                    <span>{t('Loading activity timeline...', 'جاري تحميل سجل الأنشطة...')}</span>
                </div>
            ) : notifications.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-400 space-y-1">
                    <p className="font-bold text-zinc-600 dark:text-zinc-300">
                        {t('No recorded activity yet', 'لا توجد أنشطة أو إشعارات مسجلة')}
                    </p>
                    <p className="text-[11px]">
                        {t('New system alerts and task updates will appear here in chronological order.', 'ستظهر هنا كافة إشعارات وتحديثات المهام فور وصولها.')}
                    </p>
                </div>
            ) : (
                <div className="relative pl-3 rtl:pl-0 rtl:pr-3 space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[17px] rtl:before:left-auto rtl:before:right-[17px] before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                    {notifications.map((item) => {
                        const Icon = TYPE_ICONS[item.type] || Info;
                        return (
                            <div
                                key={item.id}
                                className={`relative flex items-start gap-3.5 p-3 rounded-2xl transition ${
                                    item.isRead
                                        ? 'bg-transparent opacity-85 hover:opacity-100 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40'
                                        : 'bg-amber-500/5 border border-amber-500/20'
                                }`}
                            >
                                <div className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    item.isRead
                                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                        : 'bg-amber-500/20 text-amber-500 font-bold'
                                }`}>
                                    <Icon className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                            {item.title}
                                        </h4>
                                        <span className="text-[10px] text-zinc-400 shrink-0">
                                            {mounted ? item.relativeTime : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                        {item.link && (
                                            <Link
                                                href={item.link}
                                                className="text-[11px] font-bold text-[#BC5C29] hover:underline flex items-center gap-1"
                                            >
                                                <span>{t('View details', 'عرض التفاصيل')}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                        {!item.isRead && (
                                            <button
                                                type="button"
                                                onClick={() => markAsRead(item.id)}
                                                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                                            >
                                                {t('Mark as read', 'تحديد كمقروء')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
