'use client';

import React, { useEffect, useState } from 'react';
import Link from '@/shared/next-compat/link';
import Image from '@/shared/next-compat/image';
import { usePathname, useRouter } from '@/shared/next-compat/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Sun, Moon, Search } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import NotificationCenter from '@/features/notifications/components/NotificationCenter';
import MobileBottomNav from '@/components/layout/MobileBottomNavigation';
import MobileQuickActions from '@/components/layout/MobileQuickActions';

export default function Sidebar({
    isDesktopOnly = false,
    isMobileOnly = false,
    externalOpen,
    onExternalClose,
    className = ''
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { t, theme, setTheme, toggleTheme, toggleLang, lang, activeDashboard, setActiveDashboard } = useApp();

    const workspaces = [
        { id: 'money', labelEn: 'Treasury', labelAr: 'الخزينة', path: '/', icon: '💎' },
        { id: 'me', labelEn: 'Evolution', labelAr: 'الارتقاء والتطوير', path: '/tasks/overview', icon: '⚡' },
        { id: 'profile', labelEn: 'Sitemaps', labelAr: 'خرائط الموقع', path: '/profile/basic', icon: '🌐' },
        { id: 'settings', labelEn: 'Systems', labelAr: 'الأنظمة', path: '/settings/drive-config', icon: '⚙️' },
    ];

    const [internalMobileOpen, setInternalMobileOpen] = useState(false);
    const isMobileOpen = externalOpen !== undefined ? externalOpen : internalMobileOpen;
    const setIsMobileOpen = React.useCallback((val) => {
        setInternalMobileOpen((prev) => {
            const nextVal = typeof val === 'function' ? val(prev) : val;
            if (!nextVal && typeof onExternalClose === 'function') {
                onExternalClose();
            }
            return nextVal;
        });
    }, [onExternalClose]);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem('md-sidebar-collapsed') === '1';
        } catch (_) {
            return false;
        }
    });
    const [collapsedGroups, setCollapsedGroups] = useState(() => {
        if (typeof window === 'undefined') return {};
        try {
            const raw = localStorage.getItem('md-collapsed-groups');
            return raw ? JSON.parse(raw) : {};
        } catch (_) {
            return {};
        }
    });

    const toggleSidebarCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('md-sidebar-collapsed', next ? '1' : '0');
            } catch (_) { }
            return next;
        });
    };

    const toggleGroup = (groupId) => {
        setCollapsedGroups((prev) => {
            const next = { ...prev, [groupId]: !prev[groupId] };
            try {
                localStorage.setItem('md-collapsed-groups', JSON.stringify(next));
            } catch (_) { }
            return next;
        });
    };

    useEffect(() => {
        if (isMobileOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isMobileOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isMobileOpen) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobileOpen, setIsMobileOpen]);

    useEffect(() => {
        queueMicrotask(() => {
            if (pathname.startsWith('/profile')) {
                setActiveDashboard('profile');
            } else if (pathname.startsWith('/settings') || pathname.startsWith('/logs')) {
                setActiveDashboard('settings');
            } else if (pathname.startsWith('/courses') || pathname.startsWith('/notes') || pathname.startsWith('/tasks') || ['/projects', '/leads'].includes(pathname)) {
                setActiveDashboard('me');
            } else if (['/', '/pulse', '/timeline', '/months', '/streams', '/credits', '/terms', '/debts', '/reserves', '/gold', '/valuation', '/prices', '/intelligence', '/financial-reports'].includes(pathname)) {
                setActiveDashboard('money');
            }
            setIsMobileOpen(false);
            setIsQuickAddOpen(false);
        });
    }, [pathname, setActiveDashboard, setIsMobileOpen]);

    const moneyGroups = [
        {
            id: 'money-core',
            titleEn: 'Treasury & Flow',
            titleAr: 'الخزينة والتدفق المالي',
            items: [
                {
                    nameEn: 'Pulse',
                    nameAr: 'نبض الميزانية',
                    path: '/Pulse',
                    isActiveCheck: (p) => p === '/' || p === '/pulse' || p === '/treasury',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Timeline',
                    nameAr: 'الجدول الزمني (Timeline)',
                    path: '/Timeline',
                    isActiveCheck: (p) => p === '/timeline' || p === '/months',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Streams',
                    nameAr: 'العوائد والتدفقات (Streams)',
                    path: '/Streams',
                    isActiveCheck: (p) => p === '/streams' || p === '/credits',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Terms',
                    nameAr: 'الالتزامات (Terms)',
                    path: '/Terms',
                    isActiveCheck: (p) => p === '/terms' || p === '/debts',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'money-assets',
            titleEn: 'Reserves & Intel',
            titleAr: 'الاحتياطي والذكاء المالي',
            items: [
                {
                    nameEn: 'Reserves',
                    nameAr: 'احتياطي الذهب والمدخرات',
                    path: '/Reserves',
                    isActiveCheck: (p) => p === '/reserves' || p === '/gold',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Valuation',
                    nameAr: 'تسعير العملات والمعادن',
                    path: '/Valuation',
                    isActiveCheck: (p) => p === '/valuation' || p === '/prices',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Intelligence',
                    nameAr: 'التقارير المالية والذكاء المالي',
                    path: '/Intelligence',
                    isActiveCheck: (p) => p === '/intelligence' || p === '/financial-reports',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const meGroups = [
        {
            id: 'me-tasks',
            titleEn: 'Evolution Operations',
            titleAr: 'العمليات والتنفيذ',
            items: [
                {
                    nameEn: 'Mission Control',
                    nameAr: 'غرفة العمليات',
                    path: '/tasks/overview',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Sprint Board',
                    nameAr: 'لوحة المهام',
                    path: '/tasks',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Daily Focus',
                    nameAr: 'التركيز اليومي',
                    path: '/tasks/todo',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'courses-catalog',
            titleEn: 'Evolution Matrix',
            titleAr: 'مصفوفة الارتقاء',
            items: [
                {
                    nameEn: 'Evolution Radar',
                    nameAr: 'رادار التعلم والتطور',
                    path: '/courses/overview',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Skill Topology',
                    nameAr: 'شجرة المعرفة والتسلسل',
                    path: '/courses/hierarchy',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Knowledge & Materials',
                    nameAr: 'المكتبة المعرفية والمواد',
                    path: '/courses/materials',
                    isActiveCheck: (p) => p === '/courses/materials' || p.startsWith('/courses/summaries') || p.startsWith('/courses/tools') || p.startsWith('/courses/onlymind') || p.startsWith('/courses/notes'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                },
                {
                    nameEn: 'All Lectures',
                    nameAr: 'فهرس المحاضرات',
                    path: '/courses/materials/lessons',
                    isActiveCheck: (p) => p.startsWith('/courses/materials/lessons') || p.startsWith('/courses/lessons'),
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'me-crm',
            titleEn: 'Ecosystem & CRM',
            titleAr: 'المنظومة والعملاء',
            items: [
                {
                    nameEn: 'Deal Pipeline',
                    nameAr: 'فرص وعملاء الـ CRM',
                    path: '/leads',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Initiatives',
                    nameAr: 'المشاريع والمبادرات',
                    path: '/projects',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const coursesGroups = meGroups;

    const profileGroups = [
        {
            id: 'profile-identity',
            titleEn: 'Core Architecture',
            titleAr: 'الهوية والبنية',
            items: [
                {
                    nameEn: 'Identity Core',
                    nameAr: 'الهوية والبيانات',
                    path: '/profile/basic',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Manifesto & Bio',
                    nameAr: 'النبذة والخبرات',
                    path: '/profile/about',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'profile-portfolio',
            titleEn: 'Showcase & Stack',
            titleAr: 'الأعمال والعتاد',
            items: [
                {
                    nameEn: 'Track Record',
                    nameAr: 'السجل المهني والخبرات',
                    path: '/profile/experience',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Credentials',
                    nameAr: 'الاعتمادات والشهادات',
                    path: '/profile/education',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Showcase',
                    nameAr: 'معرض المشاريع والإنجازات',
                    path: '/profile/projects',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Tech Arsenal',
                    nameAr: 'العتاد التقني والمهارات',
                    path: '/profile/skills',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const settingsGroups = [
        {
            id: 'settings-infra',
            titleEn: 'Infrastructure',
            titleAr: 'البنية التحتية',
            items: [
                {
                    nameEn: 'Keys & Endpoints',
                    nameAr: 'المفاتيح والربط السحابي',
                    path: '/settings/drive-config',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Cloud Vault',
                    nameAr: 'التخزين السحابي والوسائط',
                    path: '/settings/media',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 001.09-9.88A5.5 5.5 0 0014 3.5a5.5 5.5 0 00-5.46 4.73A4.002 4.002 0 003 15z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Pipelines & Sync',
                    nameAr: 'الأتمتة والنسخ والترحيل',
                    path: '/settings/automation',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )
                }
            ]
        },
        {
            id: 'settings-security',
            titleEn: 'Security & Auth',
            titleAr: 'الأمان والتحكم',
            items: [
                {
                    nameEn: 'Access Control',
                    nameAr: 'المستخدمون والصلاحيات',
                    path: '/settings/users',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Cypher Vault',
                    nameAr: 'خزنة كلمات المرور',
                    path: '/settings/passwords',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    )
                },
                {
                    nameEn: 'Telemetry Logs',
                    nameAr: 'سجلات المراقبة والأمان',
                    path: '/logs',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    )
                }
            ]
        }
    ];

    const getActiveGroups = () => {
        if (activeDashboard === 'me' || activeDashboard === 'tasks' || activeDashboard === 'courses') return meGroups;
        if (activeDashboard === 'profile') return profileGroups;
        if (activeDashboard === 'settings') return settingsGroups;
        return moneyGroups;
    };

    const currentGroups = getActiveGroups();
    const allItems = currentGroups.flatMap((g) => g.items);

    const renderSidebarContent = (forMobile = false) => {
        const compact = !forMobile && isCollapsed;
        const CollapseIcon = lang === 'ar'
            ? (compact ? ChevronLeft : ChevronRight)
            : (compact ? ChevronRight : ChevronLeft);

        return (
            <div suppressHydrationWarning className="flex flex-col h-full justify-between">
                <div suppressHydrationWarning className="flex flex-col min-h-0 flex-1">
                    <div
                        suppressHydrationWarning
                        className={`h-14 border-b border-line flex items-center shrink-0 bg-surface/95 backdrop-blur-md ${compact ? 'justify-center px-2' : 'justify-between px-3.5'
                            }`}
                    >
                        {!compact && (
                            <Link href="/" className="flex items-center gap-2.5 min-w-0">
                                <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                                    <Image
                                        src="/logo-mark.svg"
                                        alt="Orbit"
                                        width={28}
                                        height={28}
                                        priority
                                        className="w-full h-full object-contain select-none"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span suppressHydrationWarning className="font-black text-[15px] text-ink tracking-widest leading-none truncate uppercase">
                                        ORBIT
                                    </span>
                                    <span className="text-[9.5px] font-bold text-primary tracking-widest uppercase mt-0.5">
                                        SYSTEMS
                                    </span>
                                </div>
                            </Link>
                        )}

                        {compact && (
                            <Link href="/" title="Orbit" className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                                <Image
                                    src="/logo-mark.svg"
                                    alt="Orbit"
                                    width={28}
                                    height={28}
                                    priority
                                    className="w-full h-full object-contain select-none"
                                />
                            </Link>
                        )}

                        {!forMobile ? (
                            <button
                                type="button"
                                onClick={toggleSidebarCollapse}
                                title={compact ? t('Expand sidebar', 'توسيع القائمة') : t('Collapse sidebar', 'طي القائمة')}
                                aria-label="Toggle sidebar width"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl text-muted hover:bg-line2 hover:text-ink transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                                <CollapseIcon className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsMobileOpen(false)}
                                className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted hover:bg-line2 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                aria-label={t('Close navigation', 'إغلاق القائمة')}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {forMobile && (
                        <div className="p-3 border-b border-line bg-line2/30 space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                                    {t('Workspaces', 'الأقسام الرئيسية')}
                                </span>
                                <span className="text-[10px] font-mono text-primary font-bold">
                                    {workspaces.find(w => w.id === activeDashboard)?.icon} {t(workspaces.find(w => w.id === activeDashboard)?.labelEn, workspaces.find(w => w.id === activeDashboard)?.labelAr)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {workspaces.map((ws, wIdx) => {
                                    const isCurrent = activeDashboard === ws.id;
                                    return (
                                        <button
                                            key={ws.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveDashboard(ws.id);
                                                router.push(ws.path);
                                                setIsMobileOpen(false);
                                            }}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                                wIdx === 4 ? 'col-span-2' : ''
                                            } ${isCurrent
                                                    ? 'bg-primary text-on-primary shadow-xs ring-1 ring-primary/40'
                                                    : 'bg-surface border border-line text-ink2 hover:bg-line2 active:scale-98'
                                                }`}
                                        >
                                            <span className="text-sm shrink-0">{ws.icon}</span>
                                            <span className="truncate">{t(ws.labelEn, ws.labelAr)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3 no-scrollbar bg-surface/90">
                        {currentGroups.map((group, groupIdx) => {
                            const isGroupClosed = Boolean(collapsedGroups[group.id]);

                            return (
                                <div key={group.id} className="space-y-0.5">
                                    {compact ? (
                                        groupIdx > 0 && <div className="my-2 h-px bg-line" />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.id)}
                                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-faint hover:text-ink2 transition-colors cursor-pointer"
                                        >
                                            <span className="truncate">{t(group.titleEn, group.titleAr)}</span>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 transition-transform duration-150 ${isGroupClosed ? '-rotate-90 rtl:rotate-90' : ''
                                                    }`}
                                                strokeWidth={1.75}
                                            />
                                        </button>
                                    )}

                                    {(!isGroupClosed || compact) && (
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const isActive = (() => {
                                                    if (typeof item.isActiveCheck === 'function' && item.isActiveCheck(pathname)) return true;
                                                    if (pathname === item.path) return true;
                                                    if (item.path !== '/' && pathname.startsWith(item.path + '/')) {
                                                        const hasMoreSpecificMatch = allItems.some(
                                                            (other) =>
                                                                other.path !== item.path &&
                                                                other.path.length > item.path.length &&
                                                                (pathname === other.path || pathname.startsWith(other.path + '/'))
                                                        );
                                                        return !hasMoreSpecificMatch;
                                                    }
                                                    return false;
                                                })();

                                                const labelText = t(item.nameEn, item.nameAr);

                                                return (
                                                    <Link
                                                        key={item.path}
                                                        href={item.path}
                                                        title={compact ? labelText : undefined}
                                                        onClick={() => setIsMobileOpen(false)}
                                                        aria-current={isActive ? 'page' : undefined}
                                                        className={`sidebar-link ${isActive ? 'is-active' : ''} flex items-center ${forMobile ? 'h-11 text-[13.5px] px-3 font-semibold' : 'h-[30px] text-[12.5px] px-2.5 font-medium'} rounded-xl transition-colors ${compact ? 'justify-center px-0' : 'gap-2.5'} ${isActive
                                                                ? 'bg-primary-wash text-primary-strong font-semibold'
                                                                : 'text-ink2 hover:bg-line2 hover:text-ink'
                                                            }`}
                                                    >
                                                        <span className={isActive ? 'text-primary-strong shrink-0' : 'text-muted shrink-0'}>
                                                            {item.icon}
                                                        </span>
                                                        {!compact && <span className="truncate">{labelText}</span>}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div suppressHydrationWarning className="border-t border-line shrink-0 bg-surface/90">
                    {forMobile ? (
                        <div className="p-3 flex items-center justify-center">
                            <div className="w-full inline-flex items-center justify-between p-1 rounded-xl border border-line bg-line2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${theme === 'light' ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                                        }`}
                                >
                                    <span>☀️</span>
                                    <span>Light</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    className={`flex-1 py-1 px-2 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${theme === 'dark' ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                                        }`}
                                >
                                    <span>🌙</span>
                                    <span>Dark</span>
                                </button>
                                <span className="h-3.5 w-px bg-line" />
                                <button
                                    type="button"
                                    onClick={toggleLang}
                                    className="py-1 px-2.5 rounded-lg text-[12px] font-medium text-ink2 hover:bg-surface transition-colors cursor-pointer shrink-0"
                                >
                                    {lang === 'en' ? 'عربي' : 'EN'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`px-3.5 py-2.5 text-[11px] text-faint ${compact ? 'text-center' : 'flex items-center justify-between'}`}>
                            {compact ? (
                                <span title="ORBIT · V6.0">V6.0</span>
                            ) : (
                                <>
                                    <span className="truncate">ORBIT · DS V6.0</span>
                                    <span className="tabular-nums">© 2026</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isDesktopOnly) {
        return (
            <aside
                suppressHydrationWarning
                className={`app-sidebar hidden lg:flex flex-col ${isCollapsed ? 'w-[68px]' : 'w-64'
                    } shrink-0 h-full select-none border-e border-line bg-surface/80 backdrop-blur-md text-ink transition-[width] duration-200 ${className}`}
            >
                {renderSidebarContent(false)}
            </aside>
        );
    }

    if (isMobileOnly) {
        return (
            <>
                <AnimatePresence>
                    {isMobileOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden flex" role="dialog" aria-modal="true" aria-label={t('Navigation Drawer', 'قائمة التنقل')}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setIsMobileOpen(false)}
                                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                            />

                            <motion.div
                                initial={{ x: lang === 'ar' ? '100%' : '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: lang === 'ar' ? '100%' : '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                                className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'right-0 border-l' : 'left-0 border-r'
                                    } w-72 max-w-[86vw] bg-surface border-line shadow-pop h-full flex flex-col z-50 overflow-y-auto no-scrollbar pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]`}
                            >
                                {renderSidebarContent(true)}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <MobileQuickActions open={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
            </>
        );
    }

    return (
        <aside
            suppressHydrationWarning
            className={`app-sidebar hidden lg:flex flex-col ${isCollapsed ? 'w-[68px]' : 'w-64'
                } start-0 border-e border-line bg-surface text-ink h-dvh fixed top-0 shrink-0 select-none z-30 transition-[width] duration-200 ${className}`}
        >
            {renderSidebarContent(false)}
        </aside>
    );
}
