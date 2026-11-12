'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import { cn } from '@/shared/utils/utils.js';
import {
    Wallet,
    Layers,
    GraduationCap,
    UserCheck,
    Settings as SettingsIcon
} from 'lucide-react';

export const WORKSPACES = [
    {
        id: 'treasury',
        labelEn: 'Treasury',
        labelAr: 'الخزينة',
        path: '/treasury',
        legacyPath: '/',
        icon: Wallet,
        matchPrefixes: ['/treasury', '/pulse', '/timeline', '/months', '/streams', '/credits', '/terms', '/debts', '/reserves', '/gold', '/valuation', '/prices', '/intelligence', '/financial-reports']
    },
    {
        id: 'operations',
        labelEn: 'Operations',
        labelAr: 'العمليات والمهام',
        path: '/operations',
        legacyPath: '/tasks/overview',
        icon: Layers,
        matchPrefixes: ['/operations', '/tasks', '/projects', '/leads', '/project-tasks']
    },
    {
        id: 'learning',
        labelEn: 'Learning',
        labelAr: 'منظومة التعلّم',
        path: '/learning',
        legacyPath: '/courses/overview',
        icon: GraduationCap,
        matchPrefixes: ['/learning', '/courses', '/notes']
    },
    {
        id: 'profile',
        labelEn: 'Profile',
        labelAr: 'الملف الشخصي',
        path: '/profile',
        legacyPath: '/profile/basic',
        icon: UserCheck,
        matchPrefixes: ['/profile']
    },
    {
        id: 'settings',
        labelEn: 'Settings',
        labelAr: 'الأنظمة والإعدادات',
        path: '/settings',
        legacyPath: '/settings/drive-config',
        icon: SettingsIcon,
        matchPrefixes: ['/settings', '/logs', '/sync', '/export']
    }
];

export function isWorkspaceActive(workspace, pathname) {
    if (!pathname) return false;
    if (workspace.id === 'treasury' && pathname === '/') return true;
    return workspace.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function WorkspaceSwitcher({ className, compact = false }) {
    const pathname = usePathname();
    const { lang } = useApp();
    const isAr = lang === 'ar';

    return (
        <nav
            aria-label="Workspaces"
            className={cn('flex items-center gap-1.5 p-1 rounded-xl bg-surfaceMuted/80 border border-line', className)}
        >
            {WORKSPACES.map((ws) => {
                const active = isWorkspaceActive(ws, pathname);
                const Icon = ws.icon;
                const label = isAr ? ws.labelAr : ws.labelEn;

                return (
                    <Link
                        key={ws.id}
                        href={ws.legacyPath || ws.path}
                        className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all select-none',
                            active
                                ? 'bg-primary text-white shadow-sm font-semibold'
                                : 'text-inkMuted hover:text-ink hover:bg-white/5'
                        )}
                        title={label}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!compact && <span className="truncate">{label}</span>}
                    </Link>
                );
            })}
        </nav>
    );
}

export default WorkspaceSwitcher;
