'use client';

import React, { useState } from 'react';
import Link from '@/shared/next-compat/link';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import { cn } from '@/shared/utils/utils.js';
import { WORKSPACES, isWorkspaceActive } from './WorkspaceSwitcher';
import { Sheet } from '@/components/ui/Sheet';
import { MoreHorizontal, Menu } from 'lucide-react';

export function MobileBottomNavigation({ onOpenMenu }) {
    const pathname = usePathname();
    const { lang } = useApp();
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
                <div className="flex items-center justify-around min-h-[68px] px-2 py-1.5">
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
                                    'flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                    active
                                        ? 'text-primary font-extrabold bg-primary/10'
                                        : 'text-inkMuted hover:text-ink hover:bg-line2/60'
                                )}
                            >
                                <Icon className={cn('h-5 w-5 mb-0.5 shrink-0', active && 'stroke-[2.5]')} />
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
                            'flex flex-col items-center justify-center flex-1 min-h-[48px] min-w-[48px] py-1 px-1 rounded-xl text-[11px] font-medium transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                            isMoreActive
                                ? 'text-primary font-extrabold bg-primary/10'
                                : 'text-inkMuted hover:text-ink hover:bg-line2/60'
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5 mb-0.5 shrink-0" />
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
                                        'flex items-center gap-3 p-3 min-h-[48px] rounded-xl border text-[13px] font-medium transition-all',
                                        active
                                            ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                                            : 'border-line bg-surfaceMuted/50 text-ink hover:bg-surfaceMuted'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'p-2 rounded-lg shrink-0',
                                            active ? 'bg-primary text-white' : 'bg-surface text-inkMuted'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="truncate">{label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {typeof onOpenMenu === 'function' && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsMoreOpen(false);
                                onOpenMenu();
                            }}
                            className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl border border-line bg-surface text-ink font-semibold text-[13px] hover:bg-line2 transition-colors cursor-pointer"
                        >
                            <Menu className="h-4 w-4 text-primary" />
                            <span>{isAr ? 'فتح قائمة الصفحات التفصيلية' : 'Open Full Page Navigation Drawer'}</span>
                        </button>
                    )}
                </div>
            </Sheet>
        </>
    );
}

export default MobileBottomNavigation;
