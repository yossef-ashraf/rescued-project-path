'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.jsx';
import { getAuthSession, invalidateAuthCache } from '@/features/auth/services/sessionCache.js';
import DesktopSidebar from './DesktopSidebar';
import MobileWorkspaceHeader from './MobileWorkspaceHeader';
import MobileBottomNavigation from './MobileBottomNavigation';
import DashboardHubPills from '@/components/layout/DashboardHubPills';
import GlobalOverlays from './GlobalOverlays';
import NotificationDrawer from '@/features/notifications/components/NotificationDrawer';
import Sidebar from '@/components/layout/Sidebar';
import { PortalFieldCollection } from '@/components/shared/threeui/NeuformBatchEffects';
import '@/components/shared/threeui/threeui.css';

const emptySubscribe = () => () => {};

export function AppShell({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login' || pathname === '/reset-password' || pathname === '/features/auth/pages/login';
    const isPublicSharePage = pathname?.startsWith('/share/') || pathname?.startsWith('/features/sharing/pages/share/');
    const isPublicPage = isLoginPage || isPublicSharePage;
    const isDocumentWorkspace = pathname?.includes('/book') || pathname?.includes('/lessons/');
    const isMounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
    const { theme } = useApp();
    const isLight = theme === 'light' || theme === 'mode-light';
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    useEffect(() => {
        if (isPublicPage) return;
        let isCancelled = false;

        getAuthSession()
            .then((data) => {
                if (isCancelled) return;
                if (!data?.authenticated || !data?.user) {
                    invalidateAuthCache();
                    const current = window.location.pathname + window.location.search;
                    const target =
                        current && current !== '/' && !current.startsWith('/login')
                            ? `/login?redirect=${encodeURIComponent(current)}`
                            : '/login';
                    window.location.href = target;
                }
            })
            .catch(() => {
                if (isCancelled) return;
                invalidateAuthCache();
                const current = window.location.pathname + window.location.search;
                const target =
                    current && current !== '/' && !current.startsWith('/login')
                        ? `/login?redirect=${encodeURIComponent(current)}`
                        : '/login';
                window.location.href = target;
            });

        return () => {
            isCancelled = true;
        };
    }, [isLoginPage, isPublicPage, pathname]);

    if (isPublicSharePage) {
        return (
            <div className={`min-h-dvh ${isLight ? 'bg-zinc-50 text-zinc-900' : 'bg-[#09090b] text-white'}`}>
                {children}
            </div>
        );
    }

    if (isLoginPage) {
        return (
            <div
                data-threeui-ready=""
                className={`min-h-dvh relative overflow-hidden ${isLight ? 'bg-white text-zinc-900' : 'bg-black text-white'}`}
            >
                <div className="relative z-10">{children}</div>
            </div>
        );
    }

    return (
        <div
            data-threeui-ready=""
            className="app-shell h-dvh w-full flex flex-col overflow-hidden relative bg-matte text-ink selection:bg-primary/25 selection:text-ink transition-colors duration-200"
            suppressHydrationWarning
        >
            {/* Background canvas effects behind all divs */}
            <div
                data-threeui-ready=""
                className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
                aria-hidden="true"
            >
                {isMounted && (
                    <PortalFieldCollection
                        variant="flow-field"
                        mode={isLight ? 'light' : 'dark'}
                        speed={0.85}
                        size={1.0}
                        length={1.0}
                        density={1.0}
                        opacity={isLight ? 0.95 : 0.85}
                        className="w-full h-full block"
                    />
                )}
            </div>

            {/* Top Workspace Bar (Desktop) */}
            <div className="hidden lg:flex w-full px-3 pt-1.5 pb-1 shrink-0 z-20 items-center relative">
                <DashboardHubPills />
            </div>

            {/* Mobile Header (<lg). Document workspaces already have their own focused toolbar. */}
            {!isDocumentWorkspace && <MobileWorkspaceHeader onOpenDrawer={() => setIsMobileDrawerOpen(true)} />}

            {/* Mobile Drawer (Existing Sidebar in mobile mode) */}
            <Sidebar
                isMobileOnly={true}
                externalOpen={isMobileDrawerOpen}
                onExternalClose={() => setIsMobileDrawerOpen(false)}
            />

            {/* Main Application Container */}
            <div className="flex-1 w-full min-h-0 px-0 lg:px-3 lg:pb-3 flex flex-col z-10 relative">
                <div
                    className={`w-full h-full lg:rounded-xl lg:border lg:border-line ${
                        isLight ? 'bg-white' : 'bg-black'
                    } lg:shadow-card flex flex-col lg:flex-row overflow-hidden relative`}
                >
                    {/* Desktop Sidebar */}
                    <DesktopSidebar className="relative z-10" />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
                        <main
                            className={`app-main flex-1 min-w-0 h-full overflow-y-auto ${
                                isLight ? 'bg-zinc-50 text-zinc-900' : 'bg-[#0f0f11] text-white'
                            } relative pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6 overflow-x-hidden transition-colors duration-200`}
                        >
                            <div className="app-content px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7 max-w-[1780px] mx-auto w-full space-y-6">
                                {children}
                            </div>
                        </main>
                    </div>

                    {/* Docked Notification Drawer */}
                    <NotificationDrawer />
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNavigation onOpenMenu={() => setIsMobileDrawerOpen(true)} />

            {/* Global Overlays (Modals, Toasts, Drawers, Indicators) */}
            <GlobalOverlays />
        </div>
    );
}

export default AppShell;
