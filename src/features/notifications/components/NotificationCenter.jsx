'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';
import { useNotifications, useNotificationDrawer } from '@/shared/hooks/useNotifications.js';
import NotificationDrawer from '@/features/notifications/components/NotificationDrawer';

export { NotificationDrawer };

export default function NotificationCenter() {
    const { t } = useApp();
    const { unreadCount } = useNotifications();
    const { isOpen, toggleDrawer } = useNotificationDrawer();

    return (
        <div className="relative inline-flex items-center">
            <button
                type="button"
                onClick={toggleDrawer}
                aria-expanded={isOpen}
                aria-label={t('Toggle notifications', 'الإشعارات')}
                title={t('Notifications', 'الإشعارات')}
                className={`relative inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    isOpen
                        ? 'h-9 w-9 rounded-xl border border-zinc-400 dark:border-white/80 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'h-8 w-8 rounded-lg text-muted hover:bg-line2 hover:text-ink'
                }`}
            >
                <Bell className="w-[18px] h-[18px]" strokeWidth={isOpen ? 2 : 1.75} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-white tabular-nums font-semibold text-[10px] leading-none shadow-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
}
