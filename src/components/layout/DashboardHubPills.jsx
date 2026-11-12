'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from '@/shared/next-compat/navigation';
import { ArrowUpRight, Search, LogOut, Settings, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { DASHBOARD_VERSES_LIST } from '@/shared/enums/index.js';
import { useWorkspaceItems } from '@/shared/hooks/useWorkspaceItems.js';
import { useApp } from '@/shared/context/AppContext.js';
import NotificationCenter from '@/features/notifications/components/NotificationCenter';
import { ShareButton } from '@/features/sharing';
import { apiClient } from '@/shared/http/apiClient.js';
import { getAuthSession, invalidateAuthCache } from '@/features/auth/services/sessionCache.js';
import AppShellHeader from '@/components/layout/AppShellHeader';

export { useWorkspaceItems, AppShellHeader };

const emptySubscribe = () => () => {};
const getIsMacSnapshot = () =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
const getIsMacServerSnapshot = () => false;

export default function DashboardHubPills() {
    const { t, theme, toggleTheme, lang, toggleLang } = useApp();
    const pathname = usePathname();
    const router = useRouter();
    const { items, isItemActive, activeWorkspace } = useWorkspaceItems();
    const [verseIndex, setVerseIndex] = useState(0);
    const [isVersePaused, setIsVersePaused] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const isMac = React.useSyncExternalStore(emptySubscribe, getIsMacSnapshot, getIsMacServerSnapshot);

    const currentVerse = DASHBOARD_VERSES_LIST[verseIndex] || '';
    const displayDurationMs = Math.max(18000, currentVerse.length * 140);

    useEffect(() => {
        if (isVersePaused) return undefined;
        const timer = setTimeout(() => {
            setVerseIndex((prev) => (prev + 1) % DASHBOARD_VERSES_LIST.length);
        }, displayDurationMs);
        return () => clearTimeout(timer);
    }, [verseIndex, isVersePaused, displayDurationMs]);

    useEffect(() => {
        getAuthSession()
            .then((data) => {
                if (data?.authenticated) setCurrentUser(data.user);
            })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        invalidateAuthCache();
        try {
            await apiClient.post('/api/auth/logout', {});
        } catch (_) {}
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    };

    const isOnSettings = pathname?.startsWith('/settings') || pathname?.startsWith('/logs');

    return (
        <div className="w-full flex flex-col gap-1.5 min-w-0">
            <div className="dashboard-hub w-full flex items-center justify-between gap-4 h-9 select-none min-w-0">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <div className="flex items-center gap-0.5 shrink-0 font-bold text-[13.5px] tracking-tight pe-2">
                        <span className="text-primary font-black tracking-wider">ORBIT</span>
                        <span className="text-primary">.</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {items.map((item) => {
                            const isActive = isItemActive(item);

                            if (isActive) {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => router.push(item.href)}
                                        title={item.fullName}
                                        className="h-7 px-3 rounded-lg bg-primary text-on-primary font-semibold text-[12.5px] flex items-center gap-1.5 transition-colors shadow-card cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => router.push(item.href)}
                                    title={item.fullName}
                                    className="h-7 px-2.5 rounded-lg text-muted hover:bg-surface hover:text-ink font-medium text-[12.5px] flex items-center gap-1 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                    <span>{item.label}</span>
                                    <ArrowUpRight className="w-3 h-3 text-faint opacity-75 rtl:-scale-x-100" strokeWidth={1.75} />
                                </button>
                            );
                        })}
                    </div>

                    <span className="mx-1 h-4 w-px bg-line/80 shrink-0" />

                    <button
                        type="button"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('open-command-palette'));
                            }
                        }}
                        title={t('Search workspace (Ctrl+K / ⌘K)', 'البحث السريع (Ctrl+K)')}
                        className="command-trigger focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0"
                    >
                        <Search className="w-3.5 h-3.5 text-faint shrink-0" strokeWidth={1.75} />
                        <span className="text-[12.5px] font-medium">
                            {t('Jump anywhere', 'انتقال سريع')}
                        </span>
                        <kbd>
                            <span>{isMac ? '⌘' : 'Ctrl'}</span>
                            <span>K</span>
                        </kbd>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <ShareButton
                        entityType="page"
                        entityId={0}
                        entityTitle={activeWorkspace.label}
                        label={t('Share', 'مشاركة')}
                        variant="outline"
                        size="sm"
                        className="me-1"
                    />

                    <NotificationCenter />

                    <button
                        type="button"
                        onClick={() => router.push('/settings/drive-config')}
                        title={t('Settings', 'الإعدادات')}
                        aria-label={t('Settings', 'الإعدادات')}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            isOnSettings
                                ? 'bg-primary-wash text-primary-strong'
                                : 'text-muted hover:bg-line2 hover:text-ink'
                        }`}
                    >
                        <Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </button>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? t('Switch to light mode', 'الوضع النهاري') : t('Switch to dark mode', 'الوضع الليلي')}
                        aria-label={t('Toggle theme', 'تبديل المظهر')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:bg-line2 hover:text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        ) : (
                            <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={toggleLang}
                        title={t('Switch Language', 'تغيير اللغة')}
                        aria-label={t('Switch Language', 'تغيير اللغة')}
                        className="inline-flex h-8 px-2 items-center justify-center rounded-xl text-[12px] font-semibold text-muted hover:bg-line2 hover:text-ink transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        {lang === 'en' ? 'عربي' : 'EN'}
                    </button>

                    <span className="mx-1 h-5 w-px bg-line" />

                    <button
                        type="button"
                        onClick={() => router.push('/profile/basic')}
                        title={t('Open Profile', 'فتح الملف الشخصي')}
                        className="h-8 px-2 rounded-xl hover:bg-line2 flex items-center gap-2 transition-colors cursor-pointer text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <span className="inline-flex h-6 w-6 rounded-full bg-primary-wash text-primary-strong font-semibold items-center justify-center text-[11px] shrink-0">
                            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-[12.5px] font-medium text-ink leading-tight truncate max-w-[120px]">
                                {currentUser?.name || t('Account', 'الحساب')}
                            </span>
                            <span className="text-[10px] text-faint leading-none capitalize truncate">
                                {currentUser?.role || 'admin'}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title={t('Log out', 'تسجيل الخروج')}
                        aria-label={t('Log out', 'تسجيل الخروج')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:bg-crit/10 hover:text-crit transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crit/40"
                    >
                        <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                </div>
            </div>

            <div
                onMouseEnter={() => setIsVersePaused(true)}
                onMouseLeave={() => setIsVersePaused(false)}
                className="w-full flex items-center justify-end min-w-0"
            >
                <div
                    dir="rtl"
                    className="group w-full flex items-center justify-between gap-3 rounded-lg bg-surface/65 backdrop-blur-md px-3 py-1 transition-all duration-300 hover:bg-surface/85 min-w-0"
                >
                    <button
                        type="button"
                        dir="rtl"
                        onClick={() => setVerseIndex((prev) => (prev + 1) % DASHBOARD_VERSES_LIST.length)}
                        title={currentVerse}
                        className="hidden lg:flex flex-1 min-w-0 items-center justify-start gap-2.5 text-[12px] xl:text-[12.5px] font-medium text-ink/85 group-hover:text-ink transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1.5 py-0.5 text-start"
                    >
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/12 text-primary text-[11px] leading-none shrink-0 select-none">
                            ۞
                        </span>
                        <span key={verseIndex} className="truncate leading-relaxed animate-fade-in">
                            {currentVerse}
                        </span>
                    </button>

                    <div className="flex items-center gap-1 shrink-0 opacity-65 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            type="button"
                            onClick={() =>
                                setVerseIndex((prev) => (prev - 1 + DASHBOARD_VERSES_LIST.length) % DASHBOARD_VERSES_LIST.length)
                            }
                            aria-label="الآية السابقة"
                            title="الآية السابقة"
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink hover:bg-line2 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-3 h-3" strokeWidth={2} />
                        </button>
                        <span className="text-[10px] font-mono tabular-nums text-faint px-1 select-none">
                            {verseIndex + 1}/{DASHBOARD_VERSES_LIST.length}
                        </span>
                        <button
                            type="button"
                            onClick={() => setVerseIndex((prev) => (prev + 1) % DASHBOARD_VERSES_LIST.length)}
                            aria-label="الآية التالية"
                            title="الآية التالية"
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink hover:bg-line2 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-3 h-3" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
