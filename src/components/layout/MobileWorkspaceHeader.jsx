'use client';

import React from 'react';
import Link from '@/shared/next-compat/link';
import Image from '@/shared/next-compat/image';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import { WORKSPACES, isWorkspaceActive } from './WorkspaceSwitcher';
import NotificationCenter from '@/features/notifications/components/NotificationCenter';
import { Sun, Moon, Menu, Search } from 'lucide-react';

export function MobileWorkspaceHeader({ onOpenDrawer }) {
    const pathname = usePathname();
    const { lang, theme, toggleTheme, toggleLang } = useApp();
    const isAr = lang === 'ar';
    const isLight = theme === 'light' || theme === 'mode-light';

    const currentWorkspace = WORKSPACES.find((ws) => isWorkspaceActive(ws, pathname)) || WORKSPACES[0];
    const wsTitle = isAr ? currentWorkspace.labelAr : currentWorkspace.labelEn;

    return (
        <header
            suppressHydrationWarning
            className="mobile-topbar lg:hidden flex items-center justify-between px-4 h-14 bg-surface/95 backdrop-blur-xl border-b border-line sticky top-0 z-40 shrink-0"
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <button
                    type="button"
                    onClick={onOpenDrawer}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-line2 active:scale-95 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={isAr ? 'فتح قائمة التنقل' : 'Toggle navigation drawer'}
                    title={isAr ? 'فتح قائمة التنقل' : 'Toggle navigation drawer'}
                >
                    <Menu className="h-5 w-5" />
                </button>
                <Link href="/" className="flex items-center gap-2 min-w-0">
                    <div className="relative w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-line2/80 border border-line/70">
                        <Image
                            src="/logos/image.png"
                            alt="Orbit Logo"
                            width={22}
                            height={22}
                            priority
                            className="w-5 h-5 object-contain select-none"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[13px] font-extrabold text-primary tracking-tight">ORBIT</span>
                        <span className="text-inkMuted text-[12px]" aria-hidden="true">/</span>
                        <span className="text-[13px] font-semibold text-ink truncate">{wsTitle}</span>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('open-command-palette'));
                            window.dispatchEvent(new CustomEvent('orbit:open-command-palette'));
                        }
                    }}
                    aria-label={isAr ? 'البحث السريع (Ctrl+K)' : 'Quick Search (Ctrl+K)'}
                    title={isAr ? 'البحث السريع (Ctrl+K)' : 'Quick Search (Ctrl+K)'}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-inkMuted hover:text-ink hover:bg-line2 transition-colors cursor-pointer"
                >
                    <Search className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={toggleLang}
                    aria-label={isAr ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}
                    title={isAr ? 'Switch to English' : 'التحويل للعربية'}
                    className="inline-flex h-11 min-w-[44px] px-2.5 items-center justify-center rounded-xl text-[11px] font-bold border border-line bg-surface text-inkMuted hover:text-ink hover:bg-line2 transition-colors cursor-pointer"
                >
                    {isAr ? 'EN' : 'عربي'}
                </button>
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={isLight ? (isAr ? 'تفعيل الوضع الداكن' : 'Switch to Dark Mode') : (isAr ? 'تفعيل الوضع الفاتح' : 'Switch to Light Mode')}
                    title={isLight ? 'Dark Mode' : 'Light Mode'}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-inkMuted hover:text-ink hover:bg-line2 transition-colors cursor-pointer"
                >
                    {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <NotificationCenter />
            </div>
        </header>
    );
}

export default MobileWorkspaceHeader;
