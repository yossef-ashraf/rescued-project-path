'use client';

import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';

export function useWorkspaceItems() {
    const { t } = useApp();
    const pathname = usePathname();

    const items = [
        {
            id: 'money',
            label: t('Treasury', 'الخزينة'),
            fullName: t('Treasury & Flow', 'الخزينة والتدفق المالي'),
            href: '/',
        },
        {
            id: 'me',
            label: t('Evolution', 'Evolution'),
            fullName: t('Evolution & Operations', 'Evolution - العمليات والارتقاء'),
            href: '/tasks/overview',
        },
        {
            id: 'profile',
            label: t('Sitemaps', 'Sitemaps'),
            fullName: t('Sitemaps & Stack', 'Sitemaps - الهيكل والملف المهني'),
            href: '/profile/basic',
        },
    ];

    const settingsWorkspace = {
        id: 'settings',
        label: t('Systems', 'الأنظمة'),
        fullName: t('Systems & Control', 'أنظمة التحكم والإعدادات والربط'),
        href: '/settings/drive-config',
    };

    const isItemActive = (item) =>
        pathname === item.href ||
        (item.id === 'money' && ['/', '/pulse', '/timeline', '/months', '/streams', '/credits', '/terms', '/debts', '/reserves', '/gold', '/valuation', '/prices', '/intelligence', '/financial-reports'].includes(pathname)) ||
        (item.id === 'me' && (pathname?.startsWith('/tasks') || pathname?.startsWith('/courses') || pathname?.startsWith('/notes') || ['/projects', '/calendar', '/leads', '/project-tasks'].includes(pathname))) ||
        (item.id === 'profile' && pathname?.startsWith('/profile'));

    const isSettingsRoute = pathname?.startsWith('/settings') || pathname?.startsWith('/logs') || pathname?.startsWith('/sync');
    const activeWorkspace = isSettingsRoute ? settingsWorkspace : (items.find(isItemActive) || items[0]);

    return { items, settingsWorkspace, isItemActive, isSettingsRoute, activeWorkspace };
}
