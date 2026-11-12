'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import Image from '@/shared/next-compat/image';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { WORKSPACES, isWorkspaceActive } from './WorkspaceSwitcher';
import NotificationCenter from '@/features/notifications/components/NotificationCenter';
import { Sun, Moon, Menu, Search } from 'lucide-react';

export function MobileWorkspaceHeader({ onOpenDrawer }) {
    const pathname = usePathname();
    const { lang, theme, toggleTheme } = useApp();
    const isAr = lang === 'ar';
    const isLight = theme === 'light' || theme === 'mode-light';

    const currentWorkspace = WORKSPACES.find((ws) => isWorkspaceActive(ws, pathname)) || WORKSPACES[0];
    const wsTitle = isAr ? currentWorkspace.labelAr : currentWorkspace.labelEn;

    const iconBtn = 'ui-btn ui-btn-ghost ui-btn-icon size-10 text-ink';

    return (
        <header
            suppressHydrationWarning
            className="mobile-topbar lg:hidden sticky top-0 z-40 shrink-0 flex items-center justify-between gap-2 h-14 px-2 bg-surface/90 backdrop-blur-xl border-b border-line"
        >
            <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onOpenDrawer}
                    className={iconBtn}
                    aria-label={isAr ? 'فتح قائمة التنقل' : 'Open navigation'}
                >
                    <Menu className="!size-5" />
                </button>
                <Link href="/" className="flex items-center gap-2 min-w-0 rounded-lg px-1 py-1">
                    <span className="size-7 shrink-0 grid place-items-center rounded-lg bg-line2 ring-1 ring-line">
                        <Image src="/logo-mark.svg" alt="" width={20} height={20} priority className="size-4.5 object-contain select-none" />
                    </span>
                    <span className="flex flex-col min-w-0 leading-none">
                        <span className="text-[10px] font-bold tracking-[0.14em] text-primary">ORBIT</span>
                        <span className="mt-0.5 text-[15px] font-semibold text-ink truncate">{wsTitle}</span>
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('open-command-palette'));
                            window.dispatchEvent(new CustomEvent('orbit:open-command-palette'));
                        }
                    }}
                    aria-label={isAr ? 'البحث السريع' : 'Quick search'}
                    className={iconBtn}
                >
                    <Search className="!size-[18px]" />
                </button>
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isLight ? (isAr ? 'الوضع الداكن' : 'Dark mode') : (isAr ? 'الوضع الفاتح' : 'Light mode')}
                    className={iconBtn}
                >
                    {isLight ? <Moon className="!size-[18px]" /> : <Sun className="!size-[18px]" />}
                </button>
                <NotificationCenter />
            </div>
        </header>
    );
}

export default MobileWorkspaceHeader;
