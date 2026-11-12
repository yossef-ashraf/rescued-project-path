'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';
import { WORKSPACES, isWorkspaceActive } from './WorkspaceSwitcher';
import { Sheet } from '@/components/ui/Sheet';
import { MoreHorizontal, Menu, Languages } from 'lucide-react';

export function MobileBottomNavigation({ onOpenMenu }) {
    const pathname = usePathname();
    const { lang, toggleLang } = useApp();
    const isAr = lang === 'ar';
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    if (pathname === '/login' || pathname === '/features/auth/pages/login') return null;

    // Display primary 4 tabs on bottom bar, remaining tabs under "More"
    const primaryWorkspaces = WORKSPACES.slice(0, 4);
    const secondaryWorkspaces = WORKSPACES.slice(4);
    const isMoreActive = secondaryWorkspaces.some((ws) => isWorkspaceActive(ws, pathname));

    return (
        <>
            <nav
                aria-label={isAr ? 'شريط التنقل السفلي' : 'Mobile Bottom Navigation'}
                className="mobile-nav lg:hidden fixed inset-x-0 bottom-0 z-45 bg-surface/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom,0px)]"
            >
                <div className="flex items-stretch justify-around px-1.5 py-1">
                    {primaryWorkspaces.map((ws) => {
                        const active = isWorkspaceActive(ws, pathname);
                        const Icon = ws.icon;
                        const label = isAr ? ws.labelAr : ws.labelEn;

                        return (
                            <Link
                                key={ws.id}
                                href={ws.legacyPath || ws.path}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[52px] min-w-0 px-1 rounded-lg text-[11px] font-medium transition-colors duration-75 select-none',
                                    active
                                        ? 'text-primary font-semibold'
                                        : 'text-muted hover:text-ink hover:bg-line2'
                                )}
                            >
                                {active && <span aria-hidden="true" className="absolute top-0 inset-x-1/4 h-0.5 rounded-full bg-primary" />}
                                <Icon className={cn('h-5 w-5 shrink-0', active && 'stroke-[2.25]')} />
                                <span className="truncate max-w-[72px] leading-tight">{label}</span>
                            </Link>
                        );
                    })}

                    {/* More / All Workspaces tab button */}
                    <button
                        type="button"
                        onClick={() => setIsMoreOpen(true)}
                        aria-expanded={isMoreOpen}
                        aria-label={isAr ? 'المزيد من الأقسام' : 'More workspaces'}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[52px] min-w-0 px-1 rounded-lg text-[11px] font-medium transition-colors duration-75 select-none cursor-pointer',
                            isMoreActive
                                ? 'text-primary font-semibold'
                                : 'text-muted hover:text-ink hover:bg-line2'
                        )}
                    >
                        {isMoreActive && <span aria-hidden="true" className="absolute top-0 inset-x-1/4 h-0.5 rounded-full bg-primary" />}
                        <MoreHorizontal className="h-5 w-5 shrink-0" />
                        <span className="truncate max-w-[72px] leading-tight">{isAr ? 'المزيد' : 'More'}</span>
                    </button>
                </div>
            </nav>

            {/* More Drawer Sheet */}
            <Sheet
                isOpen={isMoreOpen}
                onClose={() => setIsMoreOpen(false)}
                title={isAr ? 'كافة مساحات العمل' : 'All Workspaces'}
                side="bottom"
            >
                <div className="space-y-3 pb-6">
                    <div className="grid grid-cols-2 gap-3">
                        {WORKSPACES.map((ws) => {
                            const active = isWorkspaceActive(ws, pathname);
                            const Icon = ws.icon;
                            const label = isAr ? ws.labelAr : ws.labelEn;

                            return (
                                <Link
                                    key={ws.id}
                                    href={ws.legacyPath || ws.path}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setIsMoreOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 p-2.5 min-h-[52px] rounded-lg ring-1 text-[13px] font-medium transition-colors duration-75',
                                        active
                                            ? 'ring-primary/50 bg-primary/10 text-primary font-semibold'
                                            : 'ring-line bg-surface text-ink hover:bg-line2'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'p-2 rounded-md shrink-0',
                                            active ? 'bg-primary text-on-primary' : 'bg-line2 text-muted'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="truncate">{label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button type="button" onClick={toggleLang} className="ui-btn ui-btn-gray ui-btn-lg">
                            <Languages />
                            <span>{isAr ? 'English' : 'العربية'}</span>
                        </button>
                        {typeof onOpenMenu === 'function' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMoreOpen(false);
                                    onOpenMenu();
                                }}
                                className="ui-btn ui-btn-gray ui-btn-lg"
                            >
                                <Menu />
                                <span>{isAr ? 'كل الصفحات' : 'All pages'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </Sheet>
        </>
    );
}

export default MobileBottomNavigation;
