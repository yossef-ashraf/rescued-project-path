'use client';

import React from 'react';
import { useRouter } from '@/shared/next-compat/navigation';
import { Bell, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';
import { useNotifications, useNotificationDrawer } from '@/shared/hooks/useNotifications.js';

export default function NotificationDrawer() {
    const { t, theme } = useApp();
    const router = useRouter();
    const isLight = theme === 'light' || theme === 'mode-light';

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    } = useNotifications();

    const { isOpen, openDrawer, closeDrawer } = useNotificationDrawer();

    const hasUnread = (unreadCount > 0) || notifications.some(n => !n.isRead);
    const unreadTotal = unreadCount > 0 ? unreadCount : notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif.id);
        }
        if (notif.link) {
            router.push(notif.link);
        }
    };

    return (
        <>
            {/* Desktop: Inline Docked Panel that shrinks and divides MAIN DIV */}
            <div
                className={`hidden lg:flex h-full shrink-0 select-none relative z-20 transition-colors duration-200 ${
                    isLight ? 'bg-white/80 text-zinc-900' : 'bg-[#0f0f11]/60 text-zinc-100'
                }`}
            >
                {!isOpen ? (
                    /* Closed State: Right-edge vertical rail with "v OPEN" */
                    <div
                        className={`w-7 h-full border-s border-line flex flex-col items-center justify-center shrink-0 transition-colors duration-200 ${
                            isLight ? 'bg-zinc-100/80 text-zinc-600' : 'bg-[#0f0f11]/50 text-zinc-400'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={openDrawer}
                            className={`w-full h-full flex flex-col items-center justify-center gap-2 py-4 transition-colors cursor-pointer group bg-transparent ${
                                isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                            }`}
                            title={t('Open notifications', 'فتح الإشعارات')}
                            aria-label={t('Open notifications', 'فتح الإشعارات')}
                        >
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5 ${
                                    isLight ? 'text-zinc-500 group-hover:text-zinc-900' : 'text-zinc-400 group-hover:text-white'
                                }`}
                            />
                            <span
                                className={`text-[10px] font-bold font-mono tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase ${
                                    isLight ? 'text-zinc-600 group-hover:text-zinc-900' : 'text-zinc-300 group-hover:text-white'
                                }`}
                            >
                                OPEN
                            </span>
                        </button>
                    </div>
                ) : (
                    /* Open State: Divides the layout and shrinks MAIN DIV, with "^ CLOSE" divider rail */
                    <aside
                        className={`w-[380px] xl:w-[410px] h-full border-s border-line backdrop-blur-md flex flex-row shrink-0 transition-all duration-200 ${
                            isLight
                                ? 'bg-white/90 text-zinc-900'
                                : 'bg-[#0f0f11]/50 dark:bg-[#0f0f11]/50 text-zinc-100'
                        }`}
                        role="region"
                        aria-label={t('Notifications', 'الإشعارات')}
                    >
                        {/* Divider Rail on the left border of panel with "^ CLOSE" button */}
                        <div
                            className={`w-7 h-full border-e border-line flex flex-col items-center justify-center shrink-0 transition-colors duration-200 ${
                                isLight ? 'bg-zinc-100/80' : 'bg-[#0f0f11]/50'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={closeDrawer}
                                className={`w-full h-full flex flex-col items-center justify-center gap-2 py-4 transition-colors cursor-pointer group bg-transparent ${
                                    isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                                }`}
                                title={t('Close notifications', 'إغلاق الإشعارات')}
                                aria-label={t('Close notifications', 'إغلاق الإشعارات')}
                            >
                                <ChevronUp
                                    className={`w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 ${
                                        isLight ? 'text-zinc-500 group-hover:text-zinc-900' : 'text-zinc-400 group-hover:text-white'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] font-bold font-mono tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase ${
                                        isLight ? 'text-zinc-600 group-hover:text-zinc-900' : 'text-zinc-300 group-hover:text-white'
                                    }`}
                                >
                                    CLOSE
                                </span>
                            </button>
                        </div>

                        {/* Notifications Content Container */}
                        <div
                            className={`flex-1 min-w-0 flex flex-col h-full overflow-hidden transition-colors duration-200 ${
                                isLight ? 'bg-white/80' : 'bg-[#0f0f11]/50'
                            }`}
                        >
                            {/* Unread Action Bar */}
                            {notifications.length > 0 && (
                                <div
                                    className={`px-5 py-2.5 flex items-center justify-between text-[11px] border-b border-line shrink-0 transition-colors duration-200 ${
                                        isLight ? 'bg-zinc-50/90 text-zinc-700' : 'bg-[#0f0f11]/50 text-zinc-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-xs ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                                            {t('Notifications', 'الإشعارات')}
                                        </span>
                                        {hasUnread && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#BC5C29]/20 text-[#BC5C29] dark:text-[#FB923C] border border-[#BC5C29]/35">
                                                {unreadTotal} {t('unread', 'غير مقروءة')}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        disabled={!hasUnread}
                                        className="text-xs text-[#F97316] hover:text-[#EA580C] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent hover:bg-orange-500/10 px-2 py-1 rounded"
                                        title={t('Mark all as read', 'تحديد الكل كمقروء')}
                                    >
                                        <CheckCheck className="w-3.5 h-3.5 text-[#F97316]" />
                                        <span>{t('Mark all', 'تحديد الكل')}</span>
                                    </button>
                                </div>
                            )}

                            {/* Direct Notifications Feed (Pure, with no tabs, no divisions) */}
                            <div
                                className={`flex-1 overflow-y-auto divide-y divide-line overscroll-contain transition-colors duration-200 ${
                                    isLight ? 'bg-white/60' : 'bg-[#0f0f11]/50'
                                }`}
                            >
                                {notifications.length === 0 ? (
                                    <div className="py-28 flex flex-col items-center justify-center text-center px-4">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                                                isLight ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-800/80 text-zinc-500'
                                            }`}
                                        >
                                            <Bell className="w-6 h-6 stroke-[1.5]" />
                                        </div>
                                        <p className={`text-xs font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                            {t('No notifications right now', 'لا توجد إشعارات حالياً')}
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => {
                                        const isUnread = !notif.isRead;
                                        return (
                                            <div
                                                key={notif.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleNotificationClick(notif)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleNotificationClick(notif);
                                                    }
                                                }}
                                                className={`group relative px-5 py-3.5 cursor-pointer text-start transition select-none flex items-start gap-3 focus-visible:outline-none ${
                                                    isLight
                                                        ? isUnread
                                                            ? 'bg-amber-50/60 hover:bg-zinc-100/90 focus-visible:bg-zinc-100'
                                                            : 'bg-white/60 hover:bg-zinc-50 focus-visible:bg-zinc-100'
                                                        : isUnread
                                                            ? 'bg-[#0f0f11]/70 hover:bg-[#0f0f11]/90 focus-visible:bg-zinc-800/60'
                                                            : 'bg-[#0f0f11]/40 hover:bg-[#0f0f11]/60 focus-visible:bg-zinc-800/60'
                                                }`}
                                            >
                                                <div className="pt-1.5 shrink-0">
                                                    {isUnread ? (
                                                        <span className="block w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                                                    ) : (
                                                        <span className="block w-2 h-2 rounded-full bg-transparent" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div
                                                        className={`text-[13px] leading-snug font-semibold group-hover:text-primary transition ${
                                                            isLight ? 'text-zinc-900' : 'text-zinc-100'
                                                        }`}
                                                    >
                                                        {notif.actor_name ? (
                                                            <>
                                                                <span>{notif.actor_name}</span>{' '}
                                                                <span className={`font-normal ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                                                                    {notif.title}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            notif.title
                                                        )}
                                                    </div>

                                                    {notif.message && (
                                                        <p
                                                            className={`text-[12px] font-normal leading-relaxed line-clamp-2 ${
                                                                isLight ? 'text-zinc-600' : 'text-zinc-400'
                                                            }`}
                                                        >
                                                            {notif.message}
                                                        </p>
                                                    )}

                                                    <div
                                                        className={`pt-0.5 flex items-center gap-1.5 text-[11px] font-medium ${
                                                            isLight ? 'text-zinc-500' : 'text-zinc-400'
                                                        }`}
                                                    >
                                                        <span>{notif.type || t('Workspace', 'مساحة العمل')}</span>
                                                        <span>·</span>
                                                        <span>{notif.relativeTime}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Mobile (lg:hidden): Slide-over drawer when open */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-[120]">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={closeDrawer} />
                    <aside className="fixed top-0 end-0 bottom-0 w-full max-w-sm z-[130] flex flex-col bg-surface border-s border-line text-ink shadow-2xl">
                        <div className="h-14 px-4 flex items-center justify-between border-b border-line shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-ink">{t('Notifications', 'الإشعارات')}</span>
                                {hasUnread && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#BC5C29]/20 text-[#BC5C29]">
                                        {unreadTotal}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {hasUnread && (
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="text-xs text-primary font-semibold px-2 py-1 rounded-md hover:bg-line2 transition"
                                    >
                                        {t('Mark all', 'تحديد الكل')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-line2 transition cursor-pointer"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-line">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-muted text-xs">
                                    {t('No notifications', 'لا توجد إشعارات')}
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => {
                                            handleNotificationClick(notif);
                                            closeDrawer();
                                        }}
                                        className={`px-4 py-3.5 cursor-pointer transition ${
                                            notif.isRead ? 'hover:bg-line2/50' : 'bg-primary-wash/30 hover:bg-primary-wash/50'
                                        }`}
                                    >
                                        <div className="text-xs font-bold text-ink">{notif.title}</div>
                                        {notif.message && <p className="text-[11.5px] text-muted mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>}
                                        <div className="text-[10px] text-faint mt-1.5 flex items-center gap-2 font-mono">
                                            <span>{notif.type || 'System'}</span>
                                            <span>·</span>
                                            <span>{notif.relativeTime}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
