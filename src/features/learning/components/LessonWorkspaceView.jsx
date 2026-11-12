'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/shared/next-compat/navigation';
import {
    Save,
    Clock,
    Calendar,
    FileText,
    Sparkles,
    PanelRight,
    PanelRightClose,
    PanelRightOpen,
    Eye,
    Edit3,
    Columns,
    BookOpen,
    Users,
    Bookmark,
    Lightbulb,
    CheckCircle2,
    PlayCircle,
    ExternalLink,
    AlignRight,
    AlignLeft,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import LessonHeader from './LessonHeader.jsx';
import LessonToolbar from './LessonToolbar.jsx';
import LessonSummaryEditor from './LessonSummaryEditor.jsx';
import LessonNotesEditor from './LessonNotesEditor.jsx';
import LessonAttachments from './LessonAttachments.jsx';
import LessonResources from './LessonResources.jsx';
import FlowchartCanvas from './FlowchartCanvas.jsx';
import InteractiveCodeBlock from './InteractiveCodeBlock.jsx';
import MathPlotterBlock from './MathPlotterBlock.jsx';
import MermaidDiagram from './MermaidDiagram.jsx';
import { EquationBlock } from './EquationBlock.jsx';
import {
    fetchCourse,
    fetchLesson,
    updateLesson,
    createLesson,
    deleteLesson,
    fetchCourseLessons,
    addLessonAttachment,
    deleteLessonAttachment,
    addLessonResource,
    deleteLessonResource
} from '../api/lessons.api.js';
import { useApp } from '@/shared/context/AppContext.js';
import { cn } from '@/shared/utils/utils.js';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';

function hasArabicText(str) {
    if (!str) return false;
    return /[\u0600-\u06FF]/.test(str.slice(0, 300));
}

function getYoutubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function renderInlineMarkdown(text) {
    if (!text) return null;
    // Handle **bold**, *italic*, `code`
    const tokens = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`)/g);
    return tokens.map((tok, i) => {
        if (tok.startsWith('**') && tok.endsWith('**')) {
            return <strong key={i} className="font-bold text-ink">{tok.slice(2, -2)}</strong>;
        }
        if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
            return <em key={i} className="italic text-primary font-semibold not-italic">{tok.slice(1, -1)}</em>;
        }
        if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
            return <code key={i} className="px-1.5 py-0.5 rounded bg-surfaceMuted border border-line font-mono text-xs text-primary">{tok.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
}

function classifySectionType(headingText) {
    const h = (headingText || '').toLowerCase();
    if (h.includes('أهم الكلام') || h.includes('المحاور') || h.includes('core themes') || h.includes('synthesis')) {
        return 'themes';
    }
    if (h.includes('الشخصيات') || h.includes('الأعلام') || h.includes('figures') || h.includes('scholars')) {
        return 'figures';
    }
    if (h.includes('الكتب') || h.includes('المراجع') || h.includes('المصادر') || h.includes('books') || h.includes('references')) {
        return 'books';
    }
    if (h.includes('المصطلحات') || h.includes('المفاهيم') || h.includes('terms') || h.includes('concepts')) {
        return 'terms';
    }
    if (h.includes('تفاصيل') || h.includes('فوائد') || h.includes('خلاصات') || h.includes('details') || h.includes('takeaways')) {
        return 'takeaways';
    }
    return 'general';
}

function StructuredLectureReader({ content, contentDir = 'rtl', t, summary = '', lessonId = null }) {
    const sections = useMemo(() => {
        if (!content || !content.trim()) return [];
        const rawLines = content.split(/\r?\n/);
        const parsedSections = [];
        let currentSection = null;

        const ensureSection = () => {
            if (!currentSection) {
                currentSection = {
                    title: contentDir === 'rtl' ? 'محتوى المحاضرة والتحليل التفصيلي' : 'Lecture Content & Detailed Analysis',
                    type: 'themes',
                    items: []
                };
            }
        };

        for (let i = 0; i < rawLines.length; i++) {
            const line = rawLines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('## ')) {
                if (currentSection) parsedSections.push(currentSection);
                const headingTitle = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
                currentSection = {
                    title: headingTitle,
                    type: classifySectionType(headingTitle),
                    items: []
                };
            } else if (trimmed.startsWith('# ') && !currentSection) {
                const headingTitle = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '').trim();
                currentSection = {
                    title: headingTitle,
                    type: classifySectionType(headingTitle),
                    items: []
                };
            } else if (trimmed.startsWith('```')) {
                // Fenced code / mermaid / math block
                const langSpec = trimmed.replace(/^```/, '').trim().toLowerCase();
                const blockLines = [];
                i++;
                while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
                    blockLines.push(rawLines[i]);
                    i++;
                }
                const rawCode = blockLines.join('\n');
                ensureSection();

                if (langSpec === 'mermaid' || langSpec === 'flowchart' || langSpec === 'graph') {
                    currentSection.items.push({
                        kind: 'mermaid',
                        code: rawCode
                    });
                } else if (langSpec === 'math' || langSpec === 'latex' || langSpec === 'equation') {
                    currentSection.items.push({
                        kind: 'equation',
                        code: rawCode
                    });
                } else {
                    currentSection.items.push({
                        kind: 'code',
                        lang: langSpec || 'text',
                        code: rawCode
                    });
                }
            } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                // Markdown table
                const tableLines = [trimmed];
                while (i + 1 < rawLines.length && rawLines[i + 1].trim().startsWith('|') && rawLines[i + 1].trim().endsWith('|')) {
                    i++;
                    tableLines.push(rawLines[i].trim());
                }
                ensureSection();
                currentSection.items.push({
                    kind: 'table',
                    lines: tableLines
                });
            } else {
                if (!trimmed) continue;
                ensureSection();

                if (trimmed.startsWith('### ')) {
                    currentSection.items.push({
                        kind: 'subheading',
                        text: trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').trim()
                    });
                } else if (trimmed.startsWith('> ')) {
                    currentSection.items.push({
                        kind: 'quote',
                        text: trimmed.replace(/^>\s+/, '').trim()
                    });
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const bulletBody = trimmed.slice(2).trim();
                    // Check if it has a bold lead like **Name**: Description
                    const leadMatch = bulletBody.match(/^\*\*(.*?)\*\*\s*(?:لـ\s*\*(.*?)\*)?\s*[:\-–—]\s*([\s\S]+)$/);
                    if (leadMatch) {
                        currentSection.items.push({
                            kind: 'structured_bullet',
                            lead: leadMatch[1].trim(),
                            sublead: leadMatch[2] ? leadMatch[2].trim() : null,
                            body: leadMatch[3].trim()
                        });
                    } else {
                        currentSection.items.push({
                            kind: 'bullet',
                            text: bulletBody
                        });
                    }
                } else if (/^\d+[\.\)]\s+/.test(trimmed)) {
                    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+([\s\S]+)$/);
                    const itemBody = numMatch ? numMatch[2] : trimmed;
                    const leadMatch = itemBody.match(/^\*\*(.*?)\*\*\s*[:\-–—]\s*([\s\S]+)$/);
                    currentSection.items.push({
                        kind: 'numbered',
                        num: numMatch ? numMatch[1] : '•',
                        lead: leadMatch ? leadMatch[1].trim() : null,
                        text: leadMatch ? leadMatch[2].trim() : itemBody
                    });
                } else {
                    currentSection.items.push({
                        kind: 'paragraph',
                        text: trimmed
                    });
                }
            }
        }
        if (currentSection) parsedSections.push(currentSection);
        return parsedSections;
    }, [content, contentDir]);

    if (sections.length === 0) {
        return (
            <div className="py-16 text-center text-inkMuted text-sm border border-dashed border-line rounded-2xl">
                {t("No lecture content yet. Switch to Edit mode to write notes.", "لا يوجد محتوى للمحاضرة بعد. انتقل لوضع التعديل للكتابة.")}
            </div>
        );
    }

    const sectionMeta = {
        themes: {
            icon: BookOpen,
            badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
            borderAccent: 'border-emerald-500/25',
            headerGrad: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
            enLabel: 'Core Themes & Detailed Synthesis',
            arLabel: 'أهم الكلام والمحاور التفصيلية'
        },
        figures: {
            icon: Users,
            badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
            borderAccent: 'border-amber-500/25',
            headerGrad: 'from-amber-500/10 via-amber-500/5 to-transparent',
            enLabel: 'Mentioned Figures & Scholars',
            arLabel: 'الشخصيات والأعلام المذكورة'
        },
        books: {
            icon: Bookmark,
            badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/25',
            borderAccent: 'border-blue-500/25',
            headerGrad: 'from-blue-500/10 via-blue-500/5 to-transparent',
            enLabel: 'Books, Articles & References',
            arLabel: 'الكتب والمقالات والمراجع'
        },
        terms: {
            icon: Lightbulb,
            badgeBg: 'bg-purple-500/10 text-purple-500 border-purple-500/25',
            borderAccent: 'border-purple-500/25',
            headerGrad: 'from-purple-500/10 via-purple-500/5 to-transparent',
            enLabel: 'Key Terms & Foundational Concepts',
            arLabel: 'المصطلحات والمفاهيم التأسيسية'
        },
        takeaways: {
            icon: CheckCircle2,
            badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/25',
            borderAccent: 'border-rose-500/25',
            headerGrad: 'from-rose-500/10 via-rose-500/5 to-transparent',
            enLabel: 'Crucial Details & Practical Takeaways',
            arLabel: 'تفاصيل وفوائد وخلاصات مهمة'
        },
        general: {
            icon: FileText,
            badgeBg: 'bg-primary/10 text-primary border-primary/25',
            borderAccent: 'border-line',
            headerGrad: 'from-primary/10 via-primary/5 to-transparent',
            enLabel: 'Lecture Section',
            arLabel: 'محور تحليلي'
        }
    };

    const renderItemNode = (item, itemIdx, meta) => {
        if (item.kind === 'mermaid') {
            return (
                <div key={itemIdx} className="w-full my-4">
                    <MermaidDiagram code={item.code} />
                </div>
            );
        }
        if (item.kind === 'code') {
            return (
                <div key={itemIdx} className="my-4 rounded-2xl border border-line bg-canvas overflow-hidden shadow-2xs" dir="ltr">
                    <div className="px-4 py-2 bg-surfaceMuted border-b border-line text-xs font-mono text-inkMuted flex justify-between items-center">
                        <span className="font-bold text-primary">{item.lang ? item.lang.toUpperCase() : 'CODE'}</span>
                        <span className="text-[10px] text-inkMuted">Syntax Block</span>
                    </div>
                    <pre className="p-4 text-xs font-mono text-inkSecondary overflow-x-auto leading-relaxed select-all">
                        {item.code}
                    </pre>
                </div>
            );
        }
        if (item.kind === 'equation') {
            return (
                <div key={itemIdx} className="my-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 text-center font-mono text-base text-primary shadow-2xs" dir="ltr">
                    {item.code}
                </div>
            );
        }
        if (item.kind === 'table') {
            const rows = item.lines.map(line =>
                line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
            );
            const headers = rows[0] || [];
            const isSep = (r) => r.every(c => /^[-:\s]+$/.test(c));
            const bodyRows = rows.slice(1).filter(r => !isSep(r));

            return (
                <div key={itemIdx} className="my-4 rounded-2xl border border-line bg-surface overflow-x-auto shadow-2xs">
                    <table className="w-full text-xs text-start border-collapse">
                        {headers.length > 0 && (
                            <thead>
                                <tr className="border-b border-line bg-surfaceMuted text-ink font-bold">
                                    {headers.map((h, hIdx) => (
                                        <th key={hIdx} className="p-3 text-start">{renderInlineMarkdown(h)}</th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody className="divide-y divide-line/60">
                            {bodyRows.map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-canvas/50 transition">
                                    {r.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-3 text-ink/90">{renderInlineMarkdown(cell)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        if (item.kind === 'subheading') {
            return (
                <h3
                    key={itemIdx}
                    className="text-sm sm:text-[15px] font-extrabold text-primary pt-3 first:pt-0 pb-1 border-b border-line/50 flex items-center gap-2"
                >
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <span>{item.text}</span>
                </h3>
            );
        }
        if (item.kind === 'quote') {
            return (
                <blockquote
                    key={itemIdx}
                    className="p-4 rounded-xl bg-primary/5 border-s-4 border-primary text-sm italic text-ink/90 leading-relaxed"
                >
                    {renderInlineMarkdown(item.text)}
                </blockquote>
            );
        }
        if (item.kind === 'structured_bullet') {
            return (
                <div
                    key={itemIdx}
                    className="p-4 rounded-xl bg-surface/90 border border-line/80 hover:border-primary/40 transition space-y-1.5 leading-relaxed"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('px-2.5 py-0.5 rounded-lg text-xs font-extrabold border', meta.badgeBg)}>
                            {item.lead}
                        </span>
                        {item.sublead && (
                            <span className="text-xs font-semibold text-inkMuted bg-surfaceMuted px-2 py-0.5 rounded-md border border-line">
                                {contentDir === 'rtl' ? `المؤلف: ${item.sublead}` : `By: ${item.sublead}`}
                            </span>
                        )}
                    </div>
                    <p className="orbit-reading-prose text-[16px] leading-[1.65] text-ink/90 pt-0.5">
                        {renderInlineMarkdown(item.body)}
                    </p>
                </div>
            );
        }
        if (item.kind === 'numbered') {
            return (
                <div
                    key={itemIdx}
                    className="p-4 rounded-xl bg-surface/80 border border-line/70 flex items-start gap-3 leading-relaxed"
                >
                    <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary border border-primary/25 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {item.num}
                    </span>
                    <div className="flex-1 orbit-reading-prose text-[16px] leading-[1.65] text-ink/90">
                        {item.lead && (
                            <strong className="font-bold text-ink block mb-0.5">
                                {item.lead}
                            </strong>
                        )}
                        {renderInlineMarkdown(item.text)}
                    </div>
                </div>
            );
        }
        if (item.kind === 'bullet') {
            return (
                <div
                    key={itemIdx}
                    className="p-3.5 rounded-xl bg-surface/70 border border-line/60 flex items-start gap-2.5 text-sm text-ink/90 leading-relaxed"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                    <div className="flex-1 orbit-reading-prose text-[16px] leading-[1.65] text-ink/90">{renderInlineMarkdown(item.text || item.body)}</div>
                </div>
            );
        }
        return (
            <p
                key={itemIdx}
                className="orbit-reading-prose text-[16px] leading-[1.65] text-ink/90 bg-surface/40 p-4 rounded-xl border border-line/40"
            >
                {renderInlineMarkdown(item.text)}
            </p>
        );
    };

    return (
        <div className="space-y-6" dir={contentDir}>
            {/* Top Key Takeaways Highlight Box */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t("Executive Lecture Takeaway", "الخلاصة التنفيذية للمحاضرة")}</span>
                </div>
                <p className="orbit-reading-prose text-[15px] sm:text-[16px] text-ink/90 leading-relaxed">
                    {summary ? summary : (sections[0]?.items?.[0]?.text || sections[0]?.title || t("Core concepts and synthesis ready for review.", "المفاهيم التأسيسية ومحاور الدرس جاهزة للمراجعة والتطبيق."))}
                </p>
            </div>

            {sections.map((sec, idx) => {
                const meta = sectionMeta[sec.type] || sectionMeta.general;
                const IconComponent = meta.icon;

                return (
                    <section
                        key={idx}
                        className={cn(
                            'rounded-2xl border bg-canvas/50 overflow-hidden shadow-2xs transition-all',
                            meta.borderAccent
                        )}
                    >
                        {/* Section Header Banner */}
                        <div className={cn('px-5 py-3.5 border-b border-line/60 bg-gradient-to-r flex items-center justify-between gap-3', meta.headerGrad)}>
                            <div className="flex items-center gap-3">
                                <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center shrink-0', meta.badgeBg)}>
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-extrabold text-ink leading-snug">
                                        {sec.title}
                                    </h2>
                                    <span className="text-[11px] text-inkMuted font-medium">
                                        {contentDir === 'rtl' ? meta.enLabel : meta.arLabel}
                                    </span>
                                </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-surface/80 border border-line text-inkMuted shrink-0">
                                {sec.items.length} {contentDir === 'rtl' ? 'عنصر' : 'items'}
                            </span>
                        </div>

                        {/* Section Body */}
                        <div className="p-5 sm:p-6 space-y-3.5">
                            {sec.items.map((item, itemIdx) => renderItemNode(item, itemIdx, meta))}
                        </div>
                    </section>
                );
            })}

            {/* End of Lesson Reflection Prompt */}
            <LessonReflectionPrompt lessonId={lessonId} t={t} />
        </div>
    );
}

function LessonReflectionPrompt({ lessonId, t }) {
    const key = `orbit_lesson_reflection_${lessonId || 'default'}`;
    const [reflection, setReflection] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        queueMicrotask(() => {
            try {
                const val = localStorage.getItem(key);
                if (val) setReflection(val);
            } catch (_) { }
        });
    }, [key]);

    const handleSave = () => {
        try {
            localStorage.setItem(key, reflection);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (_) { }
    };

    return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-3 mt-6 shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{t("End-of-Lesson Reflection: How will you apply this today?", "سؤال تطبيقي سريع: كيف ستطبق ما تعلمته اليوم؟")}</span>
            </div>
            <p className="text-xs text-inkMuted leading-relaxed">
                {t("Write your personal insight, action item, or code pattern to consolidate this knowledge.", "اكتب خطوتك العملية، أو نمط الكود، أو الفائدة المباشرة لترسيخ ما تعلمته.")}
            </p>
            <div className="space-y-2">
                <textarea
                    rows={2}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder={t("e.g. Apply optimistic UI pattern in next mutation...", "مثلاً: تطبيق التحديث المتفائل (Optimistic UI) في شاشة العمليات القادمة...")}
                    className="w-full text-sm bg-surface rounded-xl border border-line p-3 text-ink focus:outline-none focus:border-primary resize-none"
                />
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ok font-semibold transition-opacity">
                        {saved ? t("Reflection saved locally!", "تم حفظ تأملك بنجاح!") : ""}
                    </span>
                    <Button
                        type="button"
                        variant="default"
                        size="default"
                        onClick={handleSave}
                        className="cursor-pointer"
                    >
                        {t("Save Reflection", "حفظ التأمل")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function LessonWorkspaceView({ courseId, lessonId = null, isNew = false, backUrl = null, basePath = null }) {
    const router = useRouter();
    const { t, lang, setLang } = useApp();
    const effectiveBackUrl = backUrl || `/courses/${courseId}`;
    const effectiveBasePath = basePath || `/courses/${courseId}`;

    const [loading, setLoading] = useState(!isNew);
    const [course, setCourse] = useState(null);
    const [lesson, setLesson] = useState(null);
    const [lessonNumber, setLessonNumber] = useState(1);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [privateNotes, setPrivateNotes] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [lectureDate, setLectureDate] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const [attachments, setAttachments] = useState([]);
    const [resources, setResources] = useState([]);
    const [allLessons, setAllLessons] = useState([]);

    // View mode: 'read' (Formatted Study View) | 'edit' (Markdown Editor) | 'split' (Side-by-side)
    const [viewMode, setViewMode] = useState(isNew ? 'edit' : 'read');
    // Reading & Writing Direction: 'rtl' | 'ltr'
    const [contentDir, setContentDir] = useState('rtl');
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);

    // Side Inspector state
    const [showInspector, setShowInspector] = useState(!isNew);
    const [inspectorTab, setInspectorTab] = useState('summary'); // 'summary' | 'notes' | 'attachments'

    // Interactive Panels state
    const [activePanels, setActivePanels] = useState({
        flowchart: false,
        codeBlock: false,
        mathPlotter: false
    });

    // Autosave state
    const [autosaveStatus, setAutosaveStatus] = useState('saved');
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const saveTimerRef = useRef(null);
    const isInitialMount = useRef(true);
    const isDirtyRef = useRef(false);

    // Textarea ref for insertion
    const textareaRef = useRef(null);

    // Load lesson and course data
    useEffect(() => {
        if (!courseId) return;

        fetchCourse(courseId).then(res => {
            const c = res?.data || res;
            if (c && c.id) setCourse(c);
        }).catch(() => { });

        fetchCourseLessons(courseId).then(res => {
            if (res?.success && Array.isArray(res.data)) {
                setAllLessons(res.data);
                if (isNew) {
                    setLessonNumber(res.data.length + 1);
                }
            }
        }).catch(() => { });

        if (isNew) {
            queueMicrotask(() => {
                setTitle('');
                setContent('');
                setViewMode('edit');
                setLoading(false);
            });
            return;
        }

        if (lessonId) {
            fetchLesson(lessonId).then(res => {
                if (res?.success && res.data) {
                    const l = res.data;
                    setLesson(l);
                    setTitle(l.title || '');
                    setDescription(l.description || '');
                    const loadedContent = l.content || l.summary || '';
                    const loadedSummary = l.summary || '';
                    setContent(loadedContent);
                    setSummary(loadedSummary);
                    setPrivateNotes(l.private_notes || '');
                    setDurationMinutes(l.duration_minutes || 45);
                    setLectureDate(l.lecture_date || '');
                    setAttachments(l.attachments || []);
                    setResources(l.resources || []);
                    isDirtyRef.current = false;

                    // Auto-detect Arabic content and set RTL automatically
                    const isAr = hasArabicText(l.title) || hasArabicText(loadedContent);
                    setContentDir(isAr ? 'rtl' : 'ltr');

                    // Check for offline draft
                    try {
                        const draftKey = `orbit_draft_lesson_${lessonId}`;
                        const draft = localStorage.getItem(draftKey);
                        if (draft) {
                            const parsed = JSON.parse(draft);
                            if (parsed.timestamp > new Date(l.updated_at).getTime()) {
                                setContent(parsed.content || loadedContent);
                                setSummary(parsed.summary || loadedSummary);
                            }
                        }
                    } catch (_) { }
                }
            }).catch(err => {
                console.error('Failed to load lesson:', err);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [courseId, lessonId, isNew]);

    // Save implementation
    const performSave = useCallback(async () => {
        if (!courseId) return;
        setAutosaveStatus('saving');

        const effectiveNumber = lessonNumber || (lesson?.lesson_number ?? ((allLessons.length || 0) + 1));
        const payload = {
            title: title.trim() || lesson?.title || (lang === 'ar' ? `المحاضرة #${effectiveNumber}` : `Lesson #${effectiveNumber}`),
            description,
            content,
            summary,
            private_notes: privateNotes,
            duration_minutes: durationMinutes,
            lecture_date: lectureDate || null
        };

        try {
            if (isNew) {
                const res = await createLesson(courseId, {
                    ...payload,
                    lesson_number: effectiveNumber
                });
                if (res?.success && res.data?.id) {
                    isDirtyRef.current = false;
                    setAutosaveStatus('saved');
                    setLastSavedAt(new Date());
                    router.replace(`${effectiveBasePath}/lessons/${res.data.id}`);
                }
            } else if (lessonId) {
                const res = await updateLesson(lessonId, payload);
                if (res?.success) {
                    isDirtyRef.current = false;
                    setAutosaveStatus('saved');
                    setLastSavedAt(new Date());
                    try {
                        localStorage.removeItem(`orbit_draft_lesson_${lessonId}`);
                    } catch (_) { }
                } else {
                    setAutosaveStatus('error');
                }
            }
        } catch (err) {
            console.error('Save failed:', err);
            setAutosaveStatus('error');
            if (lessonId) {
                try {
                    localStorage.setItem(`orbit_draft_lesson_${lessonId}`, JSON.stringify({
                        content,
                        summary,
                        timestamp: Date.now()
                    }));
                } catch (_) { }
            }
        }
    }, [courseId, lessonId, isNew, title, description, content, summary, privateNotes, durationMinutes, lectureDate, allLessons.length, lang, router, effectiveBasePath, lesson?.lesson_number, lesson?.title, lessonNumber]);

    // Autosave debounce effect
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (isNew || loading || !isDirtyRef.current) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            performSave();
        }, 1500);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [content, summary, title, description, privateNotes, durationMinutes, lectureDate, isNew, loading, performSave]);

    // Keyboard shortcut (Ctrl+S / Cmd+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                performSave();
            }
        };
        const handleBeforeUnload = (e) => {
            if (isDirtyRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [performSave]);

    const handleDeleteLesson = async () => {
        if (!lessonId || isDeleting) return;
        const confirmMsg = t(
            "Are you sure you want to delete this lesson? This action cannot be undone.",
            "هل أنت متأكد من حذف هذه المحاضرة نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        );
        if (!window.confirm(confirmMsg)) return;

        setIsDeleting(true);
        try {
            const res = await deleteLesson(lessonId);
            if (res?.success || res?.ok || res?.deleted) {
                router.replace(effectiveBackUrl);
            } else {
                alert(res?.error || t("Failed to delete lesson", "فشل حذف المحاضرة"));
            }
        } catch (err) {
            console.error('Delete failed:', err);
            alert(t("An unexpected error occurred while deleting the lesson", "حدث خطأ غير متوقع أثناء حذف المحاضرة"));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInsert = (textToInsert) => {
        if (!textToInsert) return;
        if (viewMode === 'read') setViewMode('edit');
        setContent(prev => {
            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart ?? prev.length;
                const end = textarea.selectionEnd ?? prev.length;
                const next = prev.substring(0, start) + textToInsert + prev.substring(end);
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
                }, 10);
                return next;
            }
            return prev + '\n' + textToInsert;
        });
    };

    const handleInsertEquation = () => {
        handleInsert('\n$$\nf(x) = x^2\n$$\n');
    };

    const handleAddAttachment = async (fileData) => {
        if (!lessonId) return;
        try {
            const res = await addLessonAttachment(lessonId, fileData);
            if (res?.success && res.data) {
                setAttachments(prev => [...prev, res.data]);
            }
        } catch (err) {
            console.error('Failed to add attachment:', err);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        try {
            const res = await deleteLessonAttachment(attachmentId);
            if (res?.success) {
                setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            }
        } catch (err) {
            console.error('Failed to delete attachment:', err);
        }
    };

    const handleAddResource = async (resData) => {
        if (!lessonId) return;
        try {
            const res = await addLessonResource(lessonId, resData);
            if (res?.success && res.data) {
                setResources(prev => [...prev, res.data]);
            }
        } catch (err) {
            console.error('Failed to add resource:', err);
        }
    };

    const handleDeleteResource = async (resourceId) => {
        try {
            const res = await deleteLessonResource(resourceId);
            if (res?.success) {
                setResources(prev => prev.filter(r => r.id !== resourceId));
            }
        } catch (err) {
            console.error('Failed to delete resource:', err);
        }
    };

    const currentIndex = allLessons.findIndex(l => String(l.id) === String(lessonId));
    const prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1]?.id : null;
    const nextLessonId = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1]?.id : null;
    const youtubeEmbedUrl = getYoutubeEmbedUrl(lesson?.source_url);

    if (loading) {
        return <PageDashboardSkeleton />;
    }

    return (
        <div
            className={cn(
                "mx-auto px-4 sm:px-6 space-y-5 animate-fade-in pb-20",
                showInspector ? "max-w-7xl" : "max-w-5xl"
            )}
            dir={contentDir}
        >
            {/* Top Workspace Bar */}
            <LessonHeader
                courseId={courseId}
                courseTitle={course?.title || lesson?.course?.title || t("Course", "الكورس")}
                lesson={lesson || { id: null, lesson_number: lessonNumber, title: title }}
                autosaveStatus={autosaveStatus}
                lastSavedAt={lastSavedAt}
                onManualSave={() => performSave()}
                isSaving={autosaveStatus === 'saving'}
                onDeleteLesson={handleDeleteLesson}
                isDeleting={isDeleting}
                prevLessonId={prevLessonId}
                nextLessonId={nextLessonId}
                backUrl={effectiveBackUrl}
                basePath={effectiveBasePath}
            />

            {/* Interactive Studio Drawers */}
            {activePanels.flowchart && (
                <FlowchartCanvas
                    onInsert={(item) => handleInsert(item)}
                    className="animate-in fade-in slide-in-from-top-2"
                />
            )}

            {activePanels.codeBlock && (
                <InteractiveCodeBlock
                    onInsert={(item) => handleInsert(item)}
                    className="animate-in fade-in slide-in-from-top-2"
                />
            )}

            {activePanels.mathPlotter && (
                <MathPlotterBlock
                    onInsert={(item) => handleInsert(item)}
                    className="animate-in fade-in slide-in-from-top-2"
                />
            )}

            {/* Main Study & Writing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Lecture Column */}
                <div className={cn(
                    'transition-all duration-300 space-y-4',
                    showInspector ? 'lg:col-span-8' : 'lg:col-span-12'
                )}>
                    <div className="rounded-3xl border border-line bg-surface/95 backdrop-blur-sm p-5 sm:p-8 space-y-5 shadow-xs">
                        {/* Document Title & Metadata Header */}
                        <div className="space-y-4 border-b border-line pb-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                                        #{lesson?.lesson_number || lessonNumber}
                                    </span>
                                    <input
                                        type="text"
                                        value={title}
                                        dir="auto"
                                        onChange={(e) => { isDirtyRef.current = true; setTitle(e.target.value); }}
                                        placeholder={t("Lesson title or lecture name...", "عنوان المحاضرة أو الدرس...")}
                                        className="w-full text-xl sm:text-2xl font-black bg-transparent border-0 outline-none text-ink placeholder:text-inkMuted/30 focus:ring-0 leading-snug"
                                    />
                                </div>

                                {isNew && (
                                    <button
                                        type="button"
                                        onClick={() => performSave()}
                                        disabled={autosaveStatus === 'saving'}
                                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-xs disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>{autosaveStatus === 'saving' ? t("Saving...", "جاري الحفظ...") : t("Save Lesson", "حفظ المحاضرة")}</span>
                                    </button>
                                )}
                            </div>

                            {/* Metadata & Controls Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-line/60">
                                {/* Left Side: View Mode, Panels & Content Direction */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowInspector(prev => !prev)}
                                        className={cn(
                                            'inline-flex h-8 items-center gap-1.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs',
                                            showInspector
                                                ? 'bg-primary/15 text-primary border-primary/30'
                                                : 'bg-surfaceMuted border-line text-inkSecondary hover:text-ink hover:bg-surface'
                                        )}
                                        title={showInspector ? t("Hide Side Panel", "إخفاء اللوحة الجانبية") : t("Show Side Panel", "عرض اللوحة الجانبية")}
                                    >
                                        <PanelRight className="w-3.5 h-3.5" />
                                        <span>{t("Lesson Panel", "لوحة المحاضرة")}</span>
                                    </button>

                                    <div className="inline-flex h-8 items-center p-0.5 rounded-xl bg-surfaceMuted border border-line text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('read')}
                                            className={cn(
                                                'h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center gap-1',
                                                viewMode === 'read' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-inkMuted hover:text-ink'
                                            )}
                                        >
                                            <Eye className="w-3 h-3" />
                                            <span>{t("Study View", "وضع القراءة")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('split')}
                                            className={cn(
                                                'h-7 px-2.5 rounded-lg transition cursor-pointer hidden sm:flex items-center gap-1',
                                                viewMode === 'split' ? 'bg-primary text-on-primary shadow-2xs' : 'text-inkMuted hover:text-ink'
                                            )}
                                        >
                                            <Columns className="w-3 h-3" />
                                            <span>{t("Split", "مزدوج")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('edit')}
                                            className={cn(
                                                'h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center gap-1',
                                                viewMode === 'edit' ? 'bg-primary text-on-primary shadow-2xs' : 'text-inkMuted hover:text-ink'
                                            )}
                                        >
                                            <Edit3 className="w-3 h-3" />
                                            <span>{t("Editor View", "وضع التحرير")}</span>
                                        </button>
                                    </div>

                                    <div className="inline-flex h-8 items-center p-0.5 rounded-xl bg-surfaceMuted border border-line text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setContentDir('rtl')}
                                            className={cn(
                                                'h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center gap-1',
                                                contentDir === 'rtl' ? 'bg-primary text-on-primary shadow-2xs' : 'text-inkMuted hover:text-ink'
                                            )}
                                            title="محاذاة المحتوى المكتوب من اليمين لليسار (RTL)"
                                        >
                                            <AlignRight className="w-3 h-3" />
                                            <span>عربي RTL</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setContentDir('ltr')}
                                            className={cn(
                                                'h-7 px-2.5 rounded-lg transition cursor-pointer flex items-center gap-1',
                                                contentDir === 'ltr' ? 'bg-primary text-on-primary shadow-2xs' : 'text-inkMuted hover:text-ink'
                                            )}
                                            title="Left-to-Right written content alignment (LTR)"
                                        >
                                            <AlignLeft className="w-3 h-3" />
                                            <span>EN LTR</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right Side: Duration, Date & Embedded Video Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex h-8 items-center gap-1.5 px-3 rounded-xl bg-surfaceMuted/80 border border-line text-ink font-medium shadow-2xs">
                                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <input
                                            type="number"
                                            min="0"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                            className="w-11 bg-transparent text-center font-bold font-mono text-ink text-xs focus:outline-none"
                                        />
                                        <span className="text-[11px] text-inkMuted">{t("mins", "دقيقة")}</span>
                                    </div>

                                    <div className="inline-flex h-8 items-center gap-1.5 px-3 rounded-xl bg-surfaceMuted/80 border border-line text-ink font-medium shadow-2xs">
                                        <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                        <input
                                            type="date"
                                            value={lectureDate}
                                            onChange={(e) => setLectureDate(e.target.value)}
                                            className="bg-transparent text-xs text-ink focus:outline-none font-mono cursor-pointer"
                                        />
                                    </div>

                                    {youtubeEmbedUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setShowVideoPlayer(prev => !prev)}
                                            className={cn(
                                                'inline-flex h-8 items-center gap-1.5 px-3 rounded-xl font-bold border transition cursor-pointer text-xs shadow-2xs',
                                                showVideoPlayer
                                                    ? 'bg-rose-500 text-white border-rose-500'
                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/25 hover:bg-rose-500/20'
                                            )}
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            <span>{showVideoPlayer ? t("Hide Video", "إخفاء الفيديو") : t("Watch Video", "مشاهدة المحاضرة")}</span>
                                            {showVideoPlayer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Collapsible Embedded YouTube Player */}
                            {youtubeEmbedUrl && showVideoPlayer && (
                                <div className="pt-2 animate-in fade-in duration-200">
                                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-line bg-black shadow-lg">
                                        <iframe
                                            src={youtubeEmbedUrl}
                                            title={title || 'Lecture Video'}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Formatting Toolbar (shown in Edit or Split mode) */}
                        {(viewMode === 'edit' || viewMode === 'split') && (
                            <LessonToolbar
                                onInsert={handleInsert}
                                onInsertEquation={handleInsertEquation}
                                onToggleFlowchart={() => setActivePanels(prev => ({ ...prev, flowchart: !prev.flowchart }))}
                                onToggleCodeBlock={() => setActivePanels(prev => ({ ...prev, codeBlock: !prev.codeBlock }))}
                                onToggleMathPlotter={() => setActivePanels(prev => ({ ...prev, mathPlotter: !prev.mathPlotter }))}
                                activePanels={activePanels}
                            />
                        )}

                        {/* Main Content Body: Read Mode, Split Mode, or Edit Mode */}
                        {viewMode === 'read' && (
                            <StructuredLectureReader
                                content={content}
                                contentDir={contentDir}
                                summary={summary}
                                lessonId={lessonId}
                                t={t}
                            />
                        )}

                        {viewMode === 'edit' && (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                dir={contentDir}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t(
                                    "Start taking lecture notes, detailed explanations, and math equations... Use markdown formatting or studio tools above.",
                                    "ابدأ بتدوين محتوى المحاضرة والشروحات التفصيلية والمعادلات... يدعم الماركداون وأدوات الاستوديو أعلاه."
                                )}
                                className="w-full font-sans text-sm sm:text-[15px] leading-loose bg-canvas/60 border border-line rounded-2xl p-5 text-ink focus:outline-none focus:border-primary transition-colors resize-y min-h-[540px]"
                            />
                        )}

                        {viewMode === 'split' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    dir={contentDir}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t("Write markdown here...", "اكتب الماركداون هنا...")}
                                    className="w-full font-sans text-sm leading-loose bg-canvas/60 border border-line rounded-2xl p-4 text-ink focus:outline-none focus:border-primary transition-colors resize-y min-h-[540px]"
                                />
                                <div className="max-h-[640px] overflow-y-auto pr-1">
                                    <StructuredLectureReader
                                        content={content}
                                        contentDir={contentDir}
                                        summary={summary}
                                        lessonId={lessonId}
                                        t={t}
                                    />
                                </div>
                            </div>
                        )}

                        {/* KaTeX Equations Detected Preview */}
                        {content.includes('$$') && (
                            <div className="p-5 bg-surfaceMuted/40 rounded-2xl border border-line space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{t("Detected KaTeX Equations", "معادلات KaTeX المكتشفة في المحتوى")}</span>
                                </div>
                                <EquationBlock
                                    equation={content.match(/\$\$([\s\S]*?)\$\$/)?.[1] || 'E = mc^2'}
                                    isEditable={false}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Collapsible Tabbed Side Inspector (Col 4) */}
                {showInspector && (
                    <div className="lg:col-span-4 space-y-4 animate-in fade-in duration-200 sticky top-6">
                        {/* Segmented Inspector Tab Bar */}
                        <div className="p-1 bg-surfaceMuted/60 rounded-2xl border border-line flex items-center gap-1 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setInspectorTab('summary')}
                                className={cn(
                                    'flex-1 py-2 rounded-xl transition text-center cursor-pointer',
                                    inspectorTab === 'summary'
                                        ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                                        : 'text-inkMuted hover:text-ink'
                                )}
                            >
                                {t("Summary & Refs", "الملخص والمراجع")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectorTab('notes')}
                                className={cn(
                                    'flex-1 py-2 rounded-xl transition text-center cursor-pointer',
                                    inspectorTab === 'notes'
                                        ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                                        : 'text-inkMuted hover:text-ink'
                                )}
                            >
                                {t("My Notes", "ملاحظاتي")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInspectorTab('attachments')}
                                className={cn(
                                    'flex-1 py-2 rounded-xl transition text-center cursor-pointer',
                                    inspectorTab === 'attachments'
                                        ? 'bg-surface text-primary font-bold shadow-xs border border-line'
                                        : 'text-inkMuted hover:text-ink'
                                )}
                            >
                                {t("Files", "الملفات")} ({resources.length + attachments.length})
                            </button>
                        </div>

                        {/* Inspector Body based on active tab */}
                        <div className="space-y-4">
                            {inspectorTab === 'summary' && (
                                <>
                                    <LessonSummaryEditor
                                        summary={summary}
                                        onChange={setSummary}
                                        contentDir={contentDir}
                                        durationMinutes={durationMinutes}
                                        resourcesCount={resources.length}
                                    />
                                    <LessonResources
                                        resources={resources}
                                        onAdd={handleAddResource}
                                        onDelete={handleDeleteResource}
                                        contentDir={contentDir}
                                    />
                                </>
                            )}

                            {inspectorTab === 'notes' && (
                                <LessonNotesEditor
                                    notes={privateNotes}
                                    onChange={setPrivateNotes}
                                />
                            )}

                            {inspectorTab === 'attachments' && (
                                <div className="space-y-4">
                                    <LessonResources
                                        resources={resources}
                                        onAdd={handleAddResource}
                                        onDelete={handleDeleteResource}
                                        contentDir={contentDir}
                                    />
                                    <LessonAttachments
                                        attachments={attachments}
                                        onAdd={handleAddAttachment}
                                        onDelete={handleDeleteAttachment}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LessonWorkspaceView;
