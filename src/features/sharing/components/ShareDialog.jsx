'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Share2,
    Copy,
    Check,
    ExternalLink,
    X,
    Clock,
    ShieldCheck,
    Trash2,
    Eye,
    RefreshCw,
    AlertCircle,
    Camera,
    Database,
    Sparkles,
    GraduationCap,
    FileText,
    Layout,
    Crosshair,
    MousePointer,
    Code,
    Layers,
    ListOrdered,
    FolderTree,
    CheckCircle2,
    CheckSquare
} from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { useApp } from '@/shared/context/AppContext.jsx';
import ShareDurationSelect from './ShareDurationSelect.jsx';
import { createSharedLink, listSharedLinks, revokeSharedLink } from '@/features/sharing/api/sharing.api.js';

/**
 * Sanitize an element and extract a clean visual HTML snapshot
 */
function sanitizeElementSnapshot(el, maxLen = 3000000) {
    if (!el) return null;
    try {
        // If el itself is a canvas element
        if (el.tagName && el.tagName.toLowerCase() === 'canvas') {
            try {
                if (el.width > 0 && el.height > 0) {
                    const dataUrl = el.toDataURL('image/png');
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.className = el.className || '';
                    img.setAttribute('style', el.getAttribute('style') || '');
                    img.style.maxWidth = '100%';
                    img.style.height = el.style.height || 'auto';
                    img.style.display = 'block';
                    img.setAttribute('alt', el.getAttribute('aria-label') || 'Visualization');
                    return img.outerHTML;
                }
            } catch (e) {
                console.warn('[ShareDialog] Direct canvas capture error:', e);
            }
        }

        // 1. Force synchronous render on all canvases before cloning so they are fully populated
        const originalCanvases = el.tagName === 'CANVAS' ? [el] : Array.from(el.querySelectorAll('canvas'));
        originalCanvases.forEach(orig => {
            if (typeof orig.__renderSnapshot === 'function') {
                try {
                    orig.__renderSnapshot();
                } catch (e) {
                    console.warn('[ShareDialog] Pre-snapshot render error:', e);
                }
            }
        });

        // 2. Clone the fully-rendered element
        const clone = el.cloneNode(true);

        // 3. Convert all canvases in the clone into static <img> elements with rendered bitmap
        const clonedCanvases = clone.tagName === 'CANVAS' ? [clone] : Array.from(clone.querySelectorAll('canvas'));
        originalCanvases.forEach((orig, idx) => {
            const cloned = clonedCanvases[idx];
            if (!cloned) return;
            try {
                if (orig.width > 0 && orig.height > 0) {
                    const dataUrl = orig.toDataURL('image/png');
                    if (!dataUrl || dataUrl.length < 50) return;
                    const img = document.createElement('img');
                    img.src = dataUrl;
                    img.className = cloned.className || '';
                    
                    const origStyle = orig.getAttribute('style') || '';
                    img.setAttribute('style', origStyle);
                    
                    const computed = typeof window !== 'undefined' ? window.getComputedStyle(orig) : null;
                    const isAbsolute = (cloned.className && cloned.className.includes('absolute')) || 
                                       (orig.style && orig.style.position === 'absolute') ||
                                       (computed && computed.position === 'absolute');
                    
                    if (isAbsolute) {
                        img.style.position = 'absolute';
                        img.style.top = '0';
                        img.style.left = '0';
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.maxWidth = 'none';
                        img.style.maxHeight = 'none';
                        img.style.objectFit = 'contain';
                    } else {
                        img.style.maxWidth = '100%';
                        img.style.width = orig.style.width || `${orig.clientWidth}px` || '100%';
                        img.style.height = orig.style.height || `${orig.clientHeight}px` || 'auto';
                        img.style.objectFit = 'contain';
                    }
                    img.style.display = 'block';
                    img.style.pointerEvents = 'none';
                    img.setAttribute('alt', orig.getAttribute('aria-label') || cloned.getAttribute('aria-label') || 'Visualization Canvas Snapshot');
                    cloned.parentNode?.replaceChild(img, cloned);
                }
            } catch (e) {
                console.warn('[ShareDialog] Canvas capture error:', e);
            }
        });

        // Ensure relative images are resolved to absolute URLs
        if (typeof window !== 'undefined') {
            const clonedImages = clone.querySelectorAll('img');
            clonedImages.forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
                    try {
                        img.src = new URL(src, window.location.origin).href;
                    } catch {
                        // ignore invalid url
                    }
                }
            });
        }

        // Clean interactive buttons: remove destructive actions, disable display buttons
        const clonedButtons = clone.querySelectorAll('button');
        clonedButtons.forEach(btn => {
            const action = (btn.getAttribute('data-action') || '').toLowerCase();
            const text = (btn.textContent || '').trim().toLowerCase();
            const type = (btn.getAttribute('type') || '').toLowerCase();
            if (
                action.includes('delete') ||
                action.includes('edit') ||
                action.includes('add') ||
                type === 'submit' ||
                text.includes('delete') ||
                text.includes('حذف') ||
                text.includes('new task') ||
                text.includes('إضافة') ||
                text.includes('إنشاء')
            ) {
                btn.remove();
            } else {
                btn.setAttribute('disabled', 'true');
                btn.style.pointerEvents = 'none';
                btn.style.cursor = 'default';
            }
        });

        // Strip non-visual scripts, iframes, dialogs, modals, and toasts
        const removeSelectors = [
            'script',
            'style',
            'iframe',
            'input[type="hidden"]',
            '[role="dialog"]',
            '[aria-modal="true"]',
            'nav',
            'header.app-header',
            '.no-share',
            '.toast',
            '.notification',
            '.fixed:not(.katex)',
            '[data-action="delete"]',
            '[data-action="edit"]'
        ];
        clone.querySelectorAll(removeSelectors.join(',')).forEach(item => item.remove());

        // Strip inline event handlers
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(item => {
            const attrs = Array.from(item.attributes);
            attrs.forEach(attr => {
                if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
                    item.removeAttribute(attr.name);
                }
            });
        });

        let html = clone.outerHTML || clone.innerHTML;
        if (html.length > maxLen) {
            html = html.substring(0, maxLen) + '\n<!-- Snapshot truncated for size limits -->';
        }
        return html;
    } catch (err) {
        console.warn('[ShareDialog] Failed to sanitize element:', err);
        return null;
    }
}

/**
 * Capture workspace full snapshot
 */
function captureWorkspaceSnapshot() {
    if (typeof document === 'undefined') return null;
    const root = document.querySelector('#workspace-content') ||
        document.querySelector('main') ||
        document.querySelector('[role="main"]') ||
        document.body;
    return sanitizeElementSnapshot(root);
}

/**
 * Detect available high-level components on the current page
 */
function detectPageComponents() {
    if (typeof document === 'undefined') return [];
    const list = [];

    const candidates = [
        {
            id: 'tasks-roadmap',
            titleAr: 'المخطط الزمني وخريطة المهام (Roadmap Timeline)',
            titleEn: 'Roadmap Timeline & Tasks Gantt',
            icon: Layout,
            selectors: ['#tasks-roadmap', '[data-component="tasks-roadmap"]', '.tasks-roadmap', '.gantt-container']
        },
        {
            id: 'productivity-heatmap',
            titleAr: 'الخريطة الحرارية لنشاط التعلم والإنجاز (Heatmap)',
            titleEn: 'Personal Learning & Activity Heatmap',
            icon: Sparkles,
            selectors: ['#productivity-heatmap', '[data-component="productivity-heatmap"]', '.productivity-heatmap', '[aria-label*="Heatmap"]', '[aria-label*="heat map"]', '.contribution-skyline']
        },
        {
            id: 'tasks-stats',
            titleAr: 'بطاقات إحصائيات ومؤشرات الأداء (KPIs)',
            titleEn: 'KPI Performance Metrics & Stats',
            icon: Layers,
            selectors: ['#tasks-stats', '[data-component="tasks-stats"]', '.stats-grid']
        },
        {
            id: 'course-header',
            titleAr: 'بطاقة الكورس والهيدر الرئيسي',
            titleEn: 'Course Hero & Header',
            icon: GraduationCap,
            selectors: ['#course-header', '[data-component="course-header"]', 'div.course-header', 'header.course-hero']
        },
        {
            id: 'course-lessons-list',
            titleAr: 'فهرس المحاضرات والدروس',
            titleEn: 'Course Lessons Syllabus',
            icon: ListOrdered,
            selectors: ['#course-lessons-list', '[data-component="lessons-list"]', '.course-lessons']
        },
        {
            id: 'course-materials-panel',
            titleAr: 'لوحة المواد والمرفقات المعرفية',
            titleEn: 'Materials & Knowledge Panel',
            icon: FolderTree,
            selectors: ['#course-materials-panel', '[data-component="materials-panel"]', '.materials-panel']
        },
        {
            id: 'course-units-map',
            titleAr: 'خريطة الوحدات والإحصائيات',
            titleEn: 'Course Progress & Units Map',
            icon: Layers,
            selectors: ['#course-units-map', '[data-component="units-map"]', '.course-stats']
        },
        {
            id: 'lesson-content-block',
            titleAr: 'شرح ومحتوى المحاضرة النصي',
            titleEn: 'Lecture Content & Explanation',
            icon: FileText,
            selectors: ['#lesson-content-block', '[data-component="lesson-content"]', '.lesson-content', '.prose']
        },
        {
            id: 'lesson-summary-block',
            titleAr: 'بطاقة ملخص المحاضرة',
            titleEn: 'Lesson Summary Card',
            icon: Sparkles,
            selectors: ['#lesson-summary-block', '[data-component="lesson-summary"]', '.lesson-summary']
        },
        {
            id: 'interactive-code-block',
            titleAr: 'الأكواد البرمجية التفاعلية',
            titleEn: 'Interactive Code Sandbox',
            icon: Code,
            selectors: ['#interactive-code-block', '[data-component="code-block"]', 'pre.code-block', '.code-editor']
        },
        {
            id: 'flowchart-block',
            titleAr: 'المخطط الهيكلي والرسومات التوضيحية',
            titleEn: 'Flowchart & Architecture Diagram',
            icon: Layout,
            selectors: ['#flowchart-block', '[data-component="flowchart"]', '.flowchart-container']
        },
        {
            id: 'math-plotter-block',
            titleAr: 'المعادلات والرسوم الرياضية',
            titleEn: 'Math Formulas & Plotter',
            icon: Sparkles,
            selectors: ['#math-plotter-block', '[data-component="math-plotter"]', '.math-plotter', '.katex-display']
        },
        {
            id: 'materials-library-table',
            titleAr: 'مكتبة المواد والمحتوى المعرفي',
            titleEn: 'Materials Knowledge Hub Table',
            icon: FolderTree,
            selectors: ['#materials-library-table', '[data-component="materials-table"]', '.materials-table', 'table']
        }
    ];

    candidates.forEach(cand => {
        for (const sel of cand.selectors) {
            const el = document.querySelector(sel);
            if (el && el.offsetHeight > 40) {
                list.push({
                    id: cand.id,
                    titleAr: cand.titleAr,
                    titleEn: cand.titleEn,
                    icon: cand.icon,
                    element: el
                });
                break;
            }
        }
    });

    return list;
}

const emptySubscribe = () => () => {};

export function ShareDialog({
    isOpen,
    onClose,
    entityType = 'page',
    entityId = 0,
    entityTitle = ''
}) {
    const { t, lang } = useApp();
    const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'manage'
    const [duration, setDuration] = useState('1h');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdLink, setCreatedLink] = useState(null);
    const [copied, setCopied] = useState(false);

    // Active links management
    const [activeLinks, setActiveLinks] = useState([]);
    const [loadingLinks, setLoadingLinks] = useState(false);

    // Detected context from route
    const [resolvedContext, setResolvedContext] = useState({
        type: entityType || 'page',
        id: entityId || 0,
        title: entityTitle || ''
    });

    // Detected components & selected component
    const [detectedComponents, setDetectedComponents] = useState([]);
    const [selectedComponent, setSelectedComponent] = useState(null);

    // Sharing modes: 'component' | 'snapshot'
    const [shareMode, setShareMode] = useState('component');

    const loadActiveLinks = async () => {
        setLoadingLinks(true);
        try {
            const res = await listSharedLinks();
            if (res?.success && Array.isArray(res.data)) {
                setActiveLinks(res.data);
            }
        } catch (err) {
            console.error('Failed to load active links:', err);
        } finally {
            setLoadingLinks(false);
        }
    };

    

    useEffect(() => {
        if (!isOpen) {
            if (typeof document !== 'undefined') {
                document.body.style.overflow = '';
            }
            return;
        }

        if (typeof document !== 'undefined') {
            document.body.style.overflow = 'hidden';
        }

        queueMicrotask(() => {
            setCreatedLink(null);
            setError('');
            setCopied(false);
        });

        // Detect context from URL
        let detectedType = entityType || 'page';
        let detectedId = entityId || 0;
        let detectedTitle = entityTitle || (typeof document !== 'undefined' ? document.title : '');

        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            const lessonMatch = pathname.match(/\/courses\/(\d+)\/lessons\/(\d+)/);
            const courseMatch = pathname.match(/\/courses\/(\d+)/);

            if (lessonMatch) {
                detectedType = 'lesson';
                if (!detectedId) detectedId = Number(lessonMatch[2]);
            } else if (courseMatch) {
                detectedType = 'course';
                if (!detectedId) detectedId = Number(courseMatch[1]);
            } else if (pathname.includes('/courses/materials')) {
                detectedType = 'page';
                if (!detectedTitle) detectedTitle = lang === 'ar' ? 'مكتبة المواد والمصادر المعرفية' : 'Materials Knowledge Library';
            }
        }

        queueMicrotask(() => {
            setResolvedContext({
                type: detectedType,
                id: detectedId,
                title: detectedTitle
            });

            const comps = detectPageComponents();
            setDetectedComponents(comps);

            if (comps.length > 0) {
                setShareMode('component');
                setSelectedComponent({
                    id: comps[0].id,
                    title: lang === 'ar' ? comps[0].titleAr : comps[0].titleEn,
                    element: comps[0].element,
                    isInteractivePicked: false
                });
            } else if (detectedType === 'course' || detectedType === 'lesson') {
                setShareMode('structured');
            } else {
                setShareMode('snapshot');
            }
        });

        if (activeTab === 'manage') {
            queueMicrotask(() => {
                loadActiveLinks();
            });
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.overflow = '';
            }
        };
    }, [isOpen, activeTab, entityType, entityId, entityTitle, lang]);

    if (!isOpen || !mounted) return null;

    const handleCreateLink = async () => {
        setLoading(true);
        setError('');
        try {
            let htmlSnapshot = null;
            let finalEntityType = 'page';
            let finalEntityId = 0;
            let componentMeta = {};

            if (shareMode === 'component') {
                finalEntityType = 'component';
                finalEntityId = resolvedContext.id || 0;

                const targetEl = selectedComponent?.element || document.querySelector('main') || document.body;
                htmlSnapshot = sanitizeElementSnapshot(targetEl);
                const compTitle = selectedComponent
                    ? (lang === 'ar' ? (selectedComponent.titleAr || selectedComponent.title) : (selectedComponent.titleEn || selectedComponent.title))
                    : (resolvedContext.title || 'عنصر مخصص');
                componentMeta = {
                    componentTitle: compTitle,
                    componentType: selectedComponent?.id || 'component'
                };
            } else {
                finalEntityType = 'page';
                finalEntityId = 0;
                htmlSnapshot = captureWorkspaceSnapshot();
            }

            const metadataPayload = {
                shareMode,
                pageTitle: resolvedContext.title,
                pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
                capturedAt: new Date().toISOString(),
                ...componentMeta,
                ...(htmlSnapshot ? { htmlSnapshot } : {})
            };

            const res = await createSharedLink({
                entityType: finalEntityType,
                entityId: finalEntityId,
                duration,
                metadata: metadataPayload
            });

            if (res?.success && res.data?.shareUrl) {
                const fullUrl = `${window.location.origin}${res.data.shareUrl}`;
                setCreatedLink({
                    ...res.data,
                    fullUrl
                });
            } else {
                setError(res?.error?.message || t('Failed to create share link', 'تعذر إنشاء رابط المشاركة'));
            }
        } catch (err) {
            setError(err?.message || t('Network connection error', 'حدث خطأ في الاتصال'));
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (url) => {
        if (!url) return;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleRevoke = async (token) => {
        try {
            await revokeSharedLink(token);
            setActiveLinks(prev => prev.filter(l => l.token !== token));
        } catch (err) {
            console.error('Failed to revoke link:', err);
        }
    };

    const hasStructuredSupport = false;

    const dialogContent = (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none transition-all duration-200"
            style={{ zIndex: 99999999, position: 'fixed', inset: 0, isolation: 'isolate' }}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="w-full max-w-xl rounded-2xl border border-line bg-surface text-ink shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 relative"
                style={{ zIndex: 100000000 }}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surfaceMuted/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-ink flex items-center gap-2">
                                <span>{t('Secure Temporary Share', 'مشاركة مؤقتة آمنة')}</span>
                                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-ok/10 text-ok border border-ok/30 font-semibold">
                                    {t('Read Only & Auto-Purge', 'للقراءة فقط والحذف التلقائي')}
                                </span>
                            </h2>
                            <p className="text-[11.5px] text-inkMuted">
                                {t('Share a specific component or view. Links are permanently deleted upon expiration.', 'مشاركة كومبونت محدد أو مظهر الشاشة. تُحذف الروابط نهائياً فور انتهاء وقتها.')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
                        aria-label={t('Close', 'إغلاق')}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs Switcher */}
                <div className="flex border-b border-line px-6 bg-surfaceMuted/20 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className={cn(
                            'py-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2',
                            activeTab === 'create'
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-inkMuted hover:text-ink'
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('Create Share Link', 'إنشاء رابط جديد')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('manage');
                            loadActiveLinks();
                        }}
                        className={cn(
                            'py-3 px-4 border-b-2 transition cursor-pointer flex items-center gap-2',
                            activeTab === 'manage'
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-inkMuted hover:text-ink'
                        )}
                    >
                        <span>{t('Active Links', 'الروابط النشطة')}</span>
                        {activeLinks.length > 0 && (
                            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-mono font-bold">
                                {activeLinks.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs">
                    {activeTab === 'create' ? (
                        <>
                            {/* Current Context Card */}
                            <div className="p-3.5 bg-surfaceMuted/60 rounded-xl border border-line flex items-center justify-between gap-3">
                                <div className="space-y-0.5 truncate flex-1">
                                    <div className="flex items-center gap-1.5 text-[10.5px] text-primary font-bold uppercase tracking-wider">
                                        {resolvedContext.type === 'course' ? (
                                            <GraduationCap className="w-3.5 h-3.5" />
                                        ) : resolvedContext.type === 'lesson' ? (
                                            <FileText className="w-3.5 h-3.5" />
                                        ) : (
                                            <Layout className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                            {resolvedContext.type === 'course'
                                                ? t('Target Course', 'الكورس الحالي')
                                                : resolvedContext.type === 'lesson'
                                                ? t('Target Lesson', 'المحاضرة الحالية')
                                                : t('Target View', 'المشهد المعروض')}
                                        </span>
                                    </div>
                                    <p className="text-[13px] font-bold text-ink truncate">
                                        {resolvedContext.title || t('Current View', 'العرض الحالي')}
                                    </p>
                                </div>
                                <span className="text-[11px] px-2.5 py-1 rounded-md bg-surface border border-line text-inkSecondary font-mono font-semibold">
                                    {resolvedContext.type}
                                    {resolvedContext.id ? ` #${resolvedContext.id}` : ''}
                                </span>
                            </div>

                            {/* Triple Sharing Mode Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-ink flex items-center justify-between">
                                    <span>{t('Select Sharing Mode', 'ما الذي تود مشاركته تحديداً؟')}</span>
                                    <span className="text-primary font-normal text-[11px]">({t('Click to select', 'انقر للاختيار')})</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Option 1: Specific Section / Component */}
                                    <div
                                        onClick={() => setShareMode('component')}
                                        className={cn(
                                            'p-3.5 rounded-xl border transition cursor-pointer space-y-2 flex flex-col justify-between',
                                            shareMode === 'component'
                                                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                                                : 'bg-surface border-line hover:border-lineStrong hover:bg-surfaceMuted/40'
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    'w-7 h-7 rounded-lg flex items-center justify-center',
                                                    shareMode === 'component' ? 'bg-primary text-on-primary' : 'bg-surfaceMuted text-inkMuted'
                                                )}>
                                                    <Crosshair className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-ink">
                                                    {t('Specific Section / Component', 'قسم أو عنصر محدد')}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                'w-4 h-4 rounded-full border flex items-center justify-center',
                                                shareMode === 'component' ? 'border-primary bg-primary text-white' : 'border-line'
                                            )}>
                                                {shareMode === 'component' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-inkMuted leading-relaxed">
                                            {t('Share a single section (notes, lecture text, code, or summary) as clean HTML.', 'مشاركة قسم أو بطاقة معينة فقط (كود، ملخص، رسم، جدول) كـ HTML نظيف.')}
                                        </p>
                                    </div>

                                    {/* Option 2: Visual HTML Snapshot */}
                                    <div
                                        onClick={() => setShareMode('snapshot')}
                                        className={cn(
                                            'p-3.5 rounded-xl border transition cursor-pointer space-y-2 flex flex-col justify-between',
                                            shareMode === 'snapshot'
                                                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                                                : 'bg-surface border-line hover:border-lineStrong hover:bg-surfaceMuted/40'
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    'w-7 h-7 rounded-lg flex items-center justify-center',
                                                    shareMode === 'snapshot' ? 'bg-primary text-on-primary' : 'bg-surfaceMuted text-inkMuted'
                                                )}>
                                                    <Camera className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-ink">
                                                    {t('Full Page View Snapshot', 'كامل الصفحة المعروضة')}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                'w-4 h-4 rounded-full border flex items-center justify-center',
                                                shareMode === 'snapshot' ? 'border-primary bg-primary text-white' : 'border-line'
                                            )}>
                                                {shareMode === 'snapshot' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-inkMuted leading-relaxed">
                                            {t('Captures full screen view including all content panels as HTML.', 'لقطة بصرية كاملة للمحتوى الشامل للشاشة الحالية كـ HTML نظيف.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Specific Component Picker Controls */}
                            {shareMode === 'component' && (
                                <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                                            <Crosshair className="w-4 h-4" />
                                            <span>{t('Target Section Selection', 'تحديد القسم المراد مشاركته')}</span>
                                        </span>
                                    </div>

                                    {/* Selected component status */}
                                    {selectedComponent && (
                                        <div className="p-3 rounded-lg bg-surface border border-primary/30 flex items-center justify-between gap-2 shadow-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                                                <div className="truncate">
                                                    <p className="font-bold text-ink text-xs truncate">
                                                        {selectedComponent.title}
                                                    </p>
                                                    <p className="text-[10px] text-inkMuted font-mono">
                                                        {selectedComponent.id}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10.5px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                                                {t('Ready to Share', 'جاهز للمشاركة')}
                                            </span>
                                        </div>
                                    )}

                                    {/* List of auto-detected components on this page */}
                                    {detectedComponents.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            <span className="text-[11px] text-inkMuted font-semibold block">
                                                {t('Or pick from detected components on this page:', 'أو اختر من الكومبونات المكتشفة في هذه الصفحة:')}
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5">
                                                {detectedComponents.map(comp => {
                                                    const CompIcon = comp.icon || Layout;
                                                    const isSelected = selectedComponent?.id === comp.id && !selectedComponent?.isInteractivePicked;
                                                    return (
                                                        <button
                                                            key={comp.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedComponent({
                                                                    id: comp.id,
                                                                    title: lang === 'ar' ? comp.titleAr : comp.titleEn,
                                                                    element: comp.element,
                                                                    isInteractivePicked: false
                                                                });
                                                            }}
                                                            className={cn(
                                                                'p-2 rounded-lg border text-start text-xs flex items-center gap-2 transition cursor-pointer',
                                                                isSelected
                                                                    ? 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                                                                    : 'bg-surface hover:bg-surfaceMuted border-line text-ink'
                                                            )}
                                                        >
                                                            <CompIcon className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate">{lang === 'ar' ? comp.titleAr : comp.titleEn}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Duration Selector */}
                            <ShareDurationSelect
                                value={duration}
                                onChange={setDuration}
                            />

                            {/* Security & Permanent Auto-Deletion Notice */}
                            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{t('Strict Privacy & Database Auto-Purge:', 'ضمانات الأمان والحذف التلقائي من قاعدة البيانات:')}</span>
                                </div>
                                <ul className="list-disc list-inside text-[11px] text-inkMuted space-y-0.5 leading-relaxed">
                                    <li>{t('Automatic DB deletion: Link is permanently erased from the database upon timeout.', 'حذف نهائي فوري: يتم مسح وحذف سجل الرابط نهائياً من قاعدة البيانات بمجرد انتهاء مدته.')}</li>
                                    <li>{t('Strict read-only: Recipient has no access to modify, upload, or tamper with data.', 'للقراءة فقط: لا يمتلك المستلم أي صلاحية تعديل أو رفع أو حذف.')}</li>
                                    <li>{t('Zero credentials needed: Safe sharing without account exposure or sessions.', 'بدون حساب أو بيانات دخول: مشاركة آمنة معزولة تماماً.')}</li>
                                </ul>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Created Link Success Box */}
                            {createdLink && (
                                <div className="p-4 rounded-xl border border-ok/30 bg-ok/5 space-y-3 animate-in fade-in zoom-in-95">
                                    <div className="flex items-center justify-between text-ok">
                                        <span className="font-bold flex items-center gap-1.5">
                                            <Check className="w-4 h-4" />
                                            {t('Link Created Successfully!', 'تم إنشاء الرابط بنجاح!')}
                                        </span>
                                        <span className="text-[11px] font-mono text-inkMuted">
                                            {t('Expires & Auto-Deletes at:', 'يُحذف نهائياً في:')} {new Date(createdLink.expiresAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={createdLink.fullUrl}
                                            className="w-full text-xs font-mono bg-surface border border-line rounded-lg px-3 py-2.5 text-ink select-all focus:outline-none focus:border-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(createdLink.fullUrl)}
                                            className={cn(
                                                'px-3.5 py-2.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer',
                                                copied
                                                    ? 'bg-ok text-white'
                                                    : 'bg-primary text-on-primary hover:opacity-90'
                                            )}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            <span>{copied ? t('Copied', 'تم النسخ') : t('Copy', 'نسخ')}</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 text-[11.5px] text-inkMuted">
                                        <span>{t('Click copy to share this link with the recipient', 'انقر على نسخ وشارك الرابط مع المستلم مباشرة')}</span>
                                        <a
                                            href={createdLink.fullUrl}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="text-primary hover:underline flex items-center gap-1 font-semibold"
                                        >
                                            <span>{t('Preview Link', 'معاينة كزائر')}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Manage Active Links Tab */
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-xs text-inkMuted">{t('Currently active temporary links (expired are auto-purged):', 'الروابط المؤقتة النشطة حالياً (تُحذف المنتهية تلقائياً):')}</span>
                                <button
                                    type="button"
                                    onClick={loadActiveLinks}
                                    className="text-[11.5px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                                >
                                    <RefreshCw className={cn('w-3 h-3', loadingLinks && 'animate-spin')} />
                                    <span>{t('Refresh List', 'تحديث القائمة')}</span>
                                </button>
                            </div>

                            {loadingLinks ? (
                                <div className="py-8 text-center text-inkMuted">{t('Loading links...', 'جاري تحميل وتحديث الروابط...')}</div>
                            ) : activeLinks.length === 0 ? (
                                <div className="py-8 text-center text-inkMuted border border-dashed border-line rounded-xl">
                                    {t('No active links at this time. All expired links were purged.', 'لا توجد روابط نشطة حالياً. تم حذف الروابط المنتهية.')}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activeLinks.map((link) => (
                                        <div
                                            key={link.id}
                                            className="p-3.5 rounded-xl border border-line bg-surface flex items-center justify-between gap-3 text-xs hover:border-lineStrong transition"
                                        >
                                            <div className="space-y-1 truncate max-w-[300px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-ink uppercase font-mono text-[11px] px-2 py-0.5 rounded bg-surfaceMuted border border-line">
                                                        {link.entityType}
                                                    </span>
                                                    <span className="text-[11px] text-inkMuted font-mono truncate" dir="ltr">
                                                        /share/s/{link.token.slice(0, 10)}...
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-inkMuted">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {t('Expires:', 'ينتهي:')} {new Date(link.expiresAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        {link.viewCount} {t('views', 'مشاهدات')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(`${window.location.origin}${link.shareUrl}`)}
                                                    className="p-2 rounded-lg border border-line hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
                                                    title={t('Copy Link', 'نسخ الرابط')}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(link.token)}
                                                    className="p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition cursor-pointer"
                                                    title={t('Delete Permanently Now', 'حذف نهائي الآن')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-line bg-surfaceMuted/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-inkMuted">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>{t('Auto-purged from database upon expiry', 'يُحذف السجل نهائياً من قاعدة البيانات عند انتهاء وقته')}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-ink text-xs font-semibold transition cursor-pointer"
                        >
                            {t('Close', 'إغلاق')}
                        </button>
                        {activeTab === 'create' && !createdLink && (
                            <button
                                type="button"
                                onClick={handleCreateLink}
                                disabled={loading}
                                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-black hover:opacity-90 transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>{loading ? t('Creating Link...', 'جاري الالتقاط والإنشاء...') : t('Generate Share Link', 'توليد رابط المشاركة المؤقت')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}

export default ShareDialog;
