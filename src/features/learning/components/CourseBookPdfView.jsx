'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from '@/shared/next-compat/link';
import { useSearchParams } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import {
    Printer,
    Download,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Clock,
    Calendar,
    User,
    ExternalLink,
    ChevronDown,
    FileText,
    Code2,
    GitBranch,
    Sigma,
    Quote,
    Library,
    Paperclip,
    Award,
    Sparkles,
    Layers,
    Compass
} from 'lucide-react';
import { fetchCourse, fetchCourseLessons } from '@/features/learning/api/lessons.api.js';
import { downloadCoursePdfFile, downloadElementAsPdf } from '../utils/pdfClientDownload.js';
import MermaidDiagram from './MermaidDiagram.jsx';

/* ============================================================================
 * 1. INLINE MARKDOWN & LATEX TYPOGRAPHY FORMATTER
 * ============================================================================ */
function formatLatexString(raw) {
    if (!raw) return '';
    return raw
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\pm/g, '±')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\cdot/g, '·')
        .replace(/\\leq/g, '≤')
        .replace(/\\geq/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\infty/g, '∞')
        .replace(/\\sum/g, '∑')
        .replace(/\\prod/g, '∏')
        .replace(/\\int/g, '∫')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\theta/g, 'θ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\pi/g, 'π')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\rightarrow/g, '→')
        .replace(/\\leftarrow/g, '←')
        .replace(/\\Rightarrow/g, '⇒')
        .replace(/\\quad/g, '   ')
        .replace(/\\text\{([^}]+)\}/g, '$1');
}

function renderInlineMarkdown(text) {
    if (!text) return null;
    // Tokenize inline math $...$, bold **...**, italic *...*, inline code `...`, and links [label](url)
    const pattern = /(\$\$[^$]+\$\$|\$[^$\n]+\$|\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\([^)]+\))/g;
    const tokens = text.split(pattern);

    return tokens.map((tok, i) => {
        if (!tok) return null;
        if ((tok.startsWith('$$') && tok.endsWith('$$')) || (tok.startsWith('$') && tok.endsWith('$') && tok.length > 2)) {
            const inner = tok.replace(/^\$+/, '').replace(/\$+$/, '');
            return (
                <span
                    key={i}
                    dir="ltr"
                    className="inline-block px-2 py-0.5 mx-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-bold text-[#BC5C29] print:bg-zinc-100 print:border-zinc-400 print:text-black"
                >
                    {formatLatexString(inner)}
                </span>
            );
        }
        if (tok.startsWith('**') && tok.endsWith('**')) {
            return (
                <strong key={i} className="font-bold text-zinc-950 dark:text-white print:text-black">
                    {tok.slice(2, -2)}
                </strong>
            );
        }
        if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
            return (
                <em key={i} className="font-semibold text-[#BC5C29] not-italic print:text-zinc-800 print:underline print:decoration-dotted">
                    {tok.slice(1, -1)}
                </em>
            );
        }
        if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
            return (
                <code
                    key={i}
                    dir="ltr"
                    className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[12px] text-[#BC5C29] print:bg-zinc-100 print:text-black print:border-zinc-300"
                >
                    {tok.slice(1, -1)}
                </code>
            );
        }
        const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            return (
                <a
                    key={i}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#BC5C29] underline font-semibold hover:opacity-80"
                >
                    {linkMatch[1]}
                </a>
            );
        }
        return <React.Fragment key={i}>{tok}</React.Fragment>;
    });
}

function parseStructuredBullet(text) {
    // Pattern 1: **Title** لـ *Author*: Description
    const bookMatch = text.match(/^\*\*(.+?)\*\*\s*(?:لـ|تأليف|-|by)\s*\*([^*]+)\*\s*[:：-]\s*(.+)$/);
    if (bookMatch) {
        return { lead: bookMatch[1].trim(), author: bookMatch[2].trim(), body: bookMatch[3].trim() };
    }
    // Pattern 2: **Lead**: Description
    const leadMatch = text.match(/^\*\*(.+?)\*\*\s*[:：-]\s*(.+)$/);
    if (leadMatch) {
        return { lead: leadMatch[1].trim(), author: null, body: leadMatch[2].trim() };
    }
    return { lead: null, author: null, body: text };
}

/* ============================================================================
 * 2. MULTI-BLOCK MARKDOWN PARSER (SECTIONS, SUBSECTIONS, CODE, MERMAID, MATH, TABLES)
 * ============================================================================ */
function classifySectionTheme(heading = '') {
    const h = heading.trim();
    if (h.includes('أهم الكلام') || h.includes('المحاور') || h.includes('Core') || h.includes('Themes')) {
        return { key: 'themes', badgeAr: 'المحاور والأفكار الرئيسية', badgeEn: 'Core Lecture Themes', accent: '#BC5C29' };
    }
    if (h.includes('الشخصيات') || h.includes('الأعلام') || h.includes('Figures') || h.includes('Scholars')) {
        return { key: 'figures', badgeAr: 'الأعلام والشخصيات المذكورة', badgeEn: 'Scholars & Key Figures', accent: '#0284c7' };
    }
    if (h.includes('الكتب') || h.includes('المراجع') || h.includes('المصادر') || h.includes('Books') || h.includes('References')) {
        return { key: 'books', badgeAr: 'الكتب والمؤلفات والمراجع', badgeEn: 'Referenced Literature & Works', accent: '#d97706' };
    }
    if (h.includes('المصطلحات') || h.includes('المفاهيم') || h.includes('Terminology') || h.includes('Concepts')) {
        return { key: 'terms', badgeAr: 'المعجم الاصطلاحي والمفاهيمي', badgeEn: 'Key Terminology & Concepts', accent: '#059669' };
    }
    if (h.includes('تفاصيل') || h.includes('فوائد') || h.includes('خلاصة') || h.includes('Takeaways') || h.includes('Insights')) {
        return { key: 'insights', badgeAr: 'الفوائد المنهجية والخلاصات', badgeEn: 'Methodological Takeaways', accent: '#7c3aed' };
    }
    return { key: 'general', badgeAr: 'مبحث تحليلي', badgeEn: 'Analytical Section', accent: '#BC5C29' };
}

function parseLectureDocument(content) {
    if (!content || !content.trim()) return [];
    const lines = content.split(/\r?\n/);
    const sections = [];
    let currentSection = null;

    const ensureSection = (defaultHeading = 'التمهيد والتحليل العام للمحاضرة') => {
        if (!currentSection) {
            currentSection = {
                heading: defaultHeading,
                theme: classifySectionTheme(defaultHeading),
                blocks: []
            };
            sections.push(currentSection);
        }
        return currentSection;
    };

    let i = 0;
    while (i < lines.length) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        // 1. Fenced Code / Mermaid / Plot Blocks: ```lang ... ```
        if (trimmed.startsWith('```')) {
            const langSpec = trimmed.slice(3).trim().toLowerCase() || 'code';
            const blockLines = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                blockLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            const sec = ensureSection();
            const rawCode = blockLines.join('\n');

            if (langSpec === 'mermaid' || langSpec === 'flowchart' || langSpec === 'graph') {
                sec.blocks.push({ type: 'mermaid', code: rawCode });
            } else if (langSpec === 'plot' || langSpec === 'mathplot' || langSpec === 'function') {
                sec.blocks.push({ type: 'mathplot', code: rawCode.trim() });
            } else if (langSpec === 'math' || langSpec === 'latex' || langSpec === 'katex') {
                sec.blocks.push({ type: 'equation', code: rawCode.trim() });
            } else {
                sec.blocks.push({ type: 'code', language: langSpec, code: rawCode });
            }
            continue;
        }

        // 2. Display Math Equation Block: $$ ... $$
        if (trimmed.startsWith('$$')) {
            if (trimmed.endsWith('$$') && trimmed.length > 4) {
                const eq = trimmed.slice(2, -2).trim();
                ensureSection().blocks.push({ type: 'equation', code: eq });
                i++;
                continue;
            } else {
                const eqLines = [trimmed.slice(2)];
                i++;
                while (i < lines.length && !lines[i].trim().endsWith('$$')) {
                    eqLines.push(lines[i]);
                    i++;
                }
                if (i < lines.length) {
                    eqLines.push(lines[i].trim().slice(0, -2));
                    i++;
                }
                ensureSection().blocks.push({ type: 'equation', code: eqLines.join('\n').trim() });
                continue;
            }
        }

        // 3. Markdown Table: | col1 | col2 |
        if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i].trim());
                i++;
            }
            const parsedRows = tableLines
                .filter(row => !/^\|[\s\-:|]+\|$/.test(row))
                .map(row =>
                    row
                        .slice(1, -1)
                        .split('|')
                        .map(cell => cell.trim())
                );
            if (parsedRows.length > 0) {
                ensureSection().blocks.push({
                    type: 'table',
                    headers: parsedRows[0],
                    rows: parsedRows.slice(1)
                });
            }
            continue;
        }

        // 4. Main Section Heading: # or ##
        if (/^#{1,2}\s+/.test(trimmed)) {
            const rawHeading = trimmed.replace(/^#{1,2}\s+/, '').trim();
            if (rawHeading.length > 60) {
                const colonIdx = rawHeading.indexOf(':');
                const cleanHeading = colonIdx > 0 && colonIdx < 50
                    ? rawHeading.slice(0, colonIdx).trim()
                    : (rawHeading.includes('المبادئ العشرة') ? 'المبادئ العشرة وتأسيس العلم' : 'المقدمة والمدخل المنهجي');
                currentSection = {
                    heading: cleanHeading,
                    theme: classifySectionTheme(cleanHeading),
                    blocks: [{ type: 'paragraph', text: rawHeading }]
                };
                sections.push(currentSection);
            } else {
                currentSection = {
                    heading: rawHeading,
                    theme: classifySectionTheme(rawHeading),
                    blocks: []
                };
                sections.push(currentSection);
            }
            i++;
            continue;
        }

        // 5. Subheading: ### or ####
        if (/^#{3,4}\s+/.test(trimmed)) {
            const subheading = trimmed.replace(/^#{3,4}\s+/, '').trim();
            ensureSection().blocks.push({ type: 'subheading', text: subheading });
            i++;
            continue;
        }

        // 6. Blockquote: > ...
        if (trimmed.startsWith('>')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
                i++;
            }
            ensureSection().blocks.push({ type: 'quote', text: quoteLines.join(' ') });
            continue;
        }

        // 7. Bullet List: - or * or •
        if (/^[-*•]\s+/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^[-*•]\s+/, '').trim());
                i++;
            }
            ensureSection().blocks.push({ type: 'list', ordered: false, items });
            continue;
        }

        // 8. Numbered List: 1. 2.
        if (/^\d+[.)]\s+/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
                items.push(lines[i].trim().replace(/^\d+[.)]\s+/, '').trim());
                i++;
            }
            ensureSection().blocks.push({ type: 'list', ordered: true, items });
            continue;
        }

        // 9. Horizontal Divider
        if (/^[-*_]{3,}$/.test(trimmed)) {
            ensureSection().blocks.push({ type: 'divider' });
            i++;
            continue;
        }

        // 10. Regular Paragraph
        if (trimmed.length > 0) {
            ensureSection().blocks.push({ type: 'paragraph', text: trimmed });
        }
        i++;
    }

    return sections;
}

/* ============================================================================
 * 3. VISUAL BOOK DIAGRAM, CODE & EQUATION RENDERERS
 * ============================================================================ */

/**
 * Renders an explicit Mermaid flowchart block as a clean vector SVG diagram
 */
function BookMermaidDiagram({ code, index = 1 }) {
    return (
        <div className="my-5 break-inside-avoid">
            <MermaidDiagram
                code={code}
                title={`مخطط تدفق وهيكلية (شكل توضيحي #${index})`}
            />
        </div>
    );
}

/**
 * Automatically synthesizes a visual SVG Concept Map for each lecture chapter
 * so every lecture in the book has an architectural schematic!
 */
function LectureConceptMapSvg({ lessonTitle, sections }) {
    const coreNodes = useMemo(() => {
        const extracted = [];
        const seen = new Set();

        for (const sec of sections) {
            for (const b of sec.blocks) {
                if (b.type === 'subheading' && b.text) {
                    const clean = b.text.replace(/^[-*•#\d.]+\s*/, '').trim();
                    if (clean && !seen.has(clean) && extracted.length < 4) {
                        seen.add(clean);
                        extracted.push({
                            title: clean.length > 45 ? clean.slice(0, 42) + '…' : clean,
                            badge: 'محور تفصيلي'
                        });
                    }
                } else if (b.type === 'list' && Array.isArray(b.items)) {
                    for (const it of b.items) {
                        const parsed = parseStructuredBullet(it);
                        if (parsed.lead && parsed.lead.length > 4 && parsed.lead.length < 50 && !seen.has(parsed.lead) && extracted.length < 4) {
                            seen.add(parsed.lead);
                            extracted.push({
                                title: parsed.lead,
                                badge: 'مفهوم رئيسي'
                            });
                        }
                    }
                }
            }
            if (sec.heading && !sec.heading.includes('التمهيد') && !seen.has(sec.heading) && extracted.length < 4) {
                seen.add(sec.heading);
                extracted.push({
                    title: sec.heading.length > 45 ? sec.heading.slice(0, 42) + '…' : sec.heading,
                    badge: sec.theme?.badgeAr || 'مبحث تحليلي'
                });
            }
        }

        if (extracted.length === 0) {
            return sections.slice(0, 4).map((s, idx) => ({
                title: s.heading || `المحور ${idx + 1}`,
                badge: `الركيزة ${idx + 1}`
            }));
        }

        return extracted.slice(0, 4);
    }, [sections]);

    if (coreNodes.length < 2) return null;

    return (
        <div className="my-6 rounded-2xl border-2 border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs break-inside-avoid text-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-5">
                <div className="flex items-center gap-2 text-xs font-black text-zinc-900">
                    <Compass className="w-4 h-4 text-[#BC5C29]" />
                    <span>الخريطة المفاهيمية والهيكل المعرفي للمحاضرة (Conceptual Architecture)</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">توليد بصري للهيكل المفاهيمي والمحاور المركزية</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
                {/* Central Root Node (Lecture Title) */}
                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500/10 border-2 border-[#BC5C29] text-[#BC5C29] font-black text-xs sm:text-sm shadow-xs max-w-xl text-center">
                    <BookOpen className="w-4 h-4 text-[#BC5C29] shrink-0" />
                    <span className="truncate">{lessonTitle}</span>
                </div>

                {/* Connecting branch down */}
                <div className="w-0.5 h-4 bg-[#BC5C29]/60" />

                {/* Horizontal Branch Bar */}
                <div className="w-[88%] max-w-2xl h-0.5 bg-[#BC5C29]/40 relative">
                    <div className="absolute left-0 top-0 w-2 h-2 rounded-full bg-[#BC5C29] -translate-y-1/2" />
                    <div className="absolute right-0 top-0 w-2 h-2 rounded-full bg-[#BC5C29] -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 w-2 h-2 rounded-full bg-[#BC5C29] -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Concept Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-1">
                    {coreNodes.map((node, idx) => (
                        <div key={idx} className="flex flex-col items-center space-y-1.5">
                            <div className="w-0.5 h-3 bg-[#BC5C29]/50" />
                            <div className="w-full bg-zinc-50/90 border border-zinc-200 rounded-xl p-3.5 text-center space-y-1 shadow-2xs">
                                <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider text-[#BC5C29] bg-[#BC5C29]/10 px-2 py-0.5 rounded-md">
                                    0{idx + 1} • {node.badge}
                                </span>
                                <h5 className="text-xs font-bold text-zinc-900 leading-snug break-words">
                                    {node.title}
                                </h5>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Renders a Code Block with line numbers, language badge, and high-contrast print styling
 */
function BookCodeBlock({ code, language = 'code', index = 1 }) {
    const lines = (code || '').split(/\r?\n/);
    return (
        <div
            dir="ltr"
            className="my-5 rounded-2xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 overflow-hidden shadow-xs break-inside-avoid"
        >
            <div className="px-4 py-2 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#BC5C29]" />
                    <span className="font-bold uppercase tracking-wider text-zinc-800">
                        {language}
                    </span>
                </div>
                <span className="text-[11px] text-zinc-400 print:text-zinc-700">
                    Code Listing #{index} • {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                </span>
            </div>

            <div className="flex font-mono text-xs leading-relaxed overflow-x-auto">
                <div className="py-3 px-2.5 bg-zinc-100/70 border-r border-zinc-200 text-zinc-400 select-none text-right min-w-[2.5rem]">
                    {lines.map((_, idx) => (
                        <div key={idx}>{idx + 1}</div>
                    ))}
                </div>
                <pre className="p-3.5 flex-1 text-zinc-900 font-mono whitespace-pre overflow-x-auto">
                    {code}
                </pre>
            </div>
        </div>
    );
}

/**
 * Renders an Equation and, if it's a function of x, renders an SVG Function Plot!
 */
function BookEquationAndPlotBlock({ code, forcePlot = false }) {
    const cleanEq = (code || '').trim();

    // Check if equation is a plottable function of x: e.g., f(x) = x^2 or y = sin(x) or forcePlot
    const plottableExpr = useMemo(() => {
        if (forcePlot) return cleanEq.replace(/^(f\(x\)|y)\s*=\s*/i, '').trim();
        const match = cleanEq.match(/^(?:f\(x\)|y)\s*=\s*([0-9xX+\-*/^().\s]+|sin\(x\)|cos\(x\)|tan\(x\)|ln\(x\)|exp\(x\))+$/i);
        if (match) {
            return cleanEq.replace(/^(?:f\(x\)|y)\s*=\s*/i, '').trim();
        }
        return null;
    }, [cleanEq, forcePlot]);

    const svgPlotPath = useMemo(() => {
        if (!plottableExpr) return null;
        const width = 440;
        const height = 220;
        const cx = width / 2;
        const cy = height / 2;
        const scale = 22;

        const evalY = (xVal) => {
            try {
                const jsExpr = plottableExpr
                    .replace(/\^/g, '**')
                    .replace(/(\d)([xX])/g, '$1*$2');
                const fn = new Function('x', 'Math', `with(Math) { return ${jsExpr}; }`);
                const res = fn(xVal, Math);
                return typeof res === 'number' && isFinite(res) ? res : null;
            } catch {
                return null;
            }
        };

        const pts = [];
        for (let px = -9; px <= 9; px += 0.15) {
            const yVal = evalY(px);
            if (yVal !== null) {
                const sx = cx + px * scale;
                const sy = cy - yVal * scale;
                if (sy >= -100 && sy <= height + 100) {
                    pts.push(`${pts.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
                }
            }
        }
        return pts.length > 2 ? { path: pts.join(' '), width, height, cx, cy, scale } : null;
    }, [plottableExpr]);

    return (
        <div className="my-5 rounded-2xl border-2 border-amber-500/30 print:border-zinc-400 bg-amber-500/5 print:bg-zinc-50 p-4 space-y-3 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-amber-500/20 print:border-zinc-300 pb-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#BC5C29] print:text-black">
                    <Sigma className="w-4 h-4" />
                    <span>معادلة رياضية / صيغة تحليلية (Mathematical Formulation)</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-500 uppercase">KaTeX / Symbolic Notation</span>
            </div>

            <div
                dir="ltr"
                className="py-3 px-4 text-center font-mono text-base sm:text-lg font-black text-zinc-950 tracking-wide overflow-x-auto"
            >
                {formatLatexString(cleanEq)}
            </div>

            {svgPlotPath && (
                <div className="pt-2 border-t border-amber-500/20 print:border-zinc-300 flex flex-col items-center">
                    <span className="text-[11px] font-mono text-zinc-500 mb-2">
                        التمثيل البياني للدالة في المستوى الإحداثي: f(x) = {plottableExpr}
                    </span>
                    <svg
                        viewBox={`0 0 ${svgPlotPath.width} ${svgPlotPath.height}`}
                        className="w-full max-w-[440px] h-[200px] bg-white rounded-xl border border-zinc-200 print:border-zinc-400"
                    >
                        <line x1="0" y1={svgPlotPath.cy} x2={svgPlotPath.width} y2={svgPlotPath.cy} stroke="#a1a1aa" strokeWidth="1.2" />
                        <line x1={svgPlotPath.cx} y1="0" x2={svgPlotPath.cx} y2={svgPlotPath.height} stroke="#a1a1aa" strokeWidth="1.2" />
                        <path d={svgPlotPath.path} fill="none" stroke="#BC5C29" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </div>
            )}
        </div>
    );
}

/* ============================================================================
 * 4. MAIN COURSE BOOK & MONOGRAPH PDF ENGINE
 * ============================================================================ */
export default function CourseBookPdfView({ courseId }) {
    const searchParams = useSearchParams();
    const { t, lang, setLang } = useApp();

    const focusLessonId = searchParams?.get('focusLesson');
    const autoPrint = searchParams?.get('print') === 'true';
    const autoDownload = searchParams?.get('download') === 'true';

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLessonFilter, setSelectedLessonFilter] = useState(focusLessonId || 'all');
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [exportProgress, setExportProgress] = useState('');

    const documentRef = React.useRef(null);

    useEffect(() => {
        if (!courseId) return;
        let isCancelled = false;

        async function loadData() {
            setLoading(true);
            try {
                const [courseRes, lessonsRes] = await Promise.all([
                    fetchCourse(courseId),
                    fetchCourseLessons(courseId)
                ]);

                if (!isCancelled) {
                    setCourse(courseRes?.data || courseRes || null);
                    const lList = lessonsRes?.data || lessonsRes || [];
                    setLessons(Array.isArray(lList) ? lList : []);
                }
            } catch (err) {
                console.error('Failed to load course book data:', err);
                if (!isCancelled) setError(err.message || 'Error loading course book');
            } finally {
                if (!isCancelled) setLoading(false);
            }
        }

        loadData();
        return () => {
            isCancelled = true;
        };
    }, [courseId]);

    

    
    const displayedLessons = useMemo(() => {
        if (selectedLessonFilter === 'all') return lessons;
        return lessons.filter(l => String(l.id) === String(selectedLessonFilter));
    }, [lessons, selectedLessonFilter]);

    const isSingleLectureMode = selectedLessonFilter !== 'all' && displayedLessons.length === 1;

    const totalMinutes = useMemo(() => {
        return displayedLessons.reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0);
    }, [displayedLessons]);

    // Aggregate all resources across displayed lessons for the Master Bibliography
    const masterBibliography = useMemo(() => {
        const list = [];
        for (const l of displayedLessons) {
            for (const r of l.resources || []) {
                list.push({
                    ...r,
                    lessonNumber: l.lesson_number,
                    lessonTitle: l.title
                });
            }
        }
        return list;
    }, [displayedLessons]);

    

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleDirectPdfDownload = useCallback(async () => {
        if (typeof window === 'undefined' || !courseId) return;
        setIsExportingPdf(true);
        setExportProgress(t("Compiling native vector PDF...", "جاري تجهيز وتوليد ملف PDF..."));

        try {
            const courseTitle = (course?.title || 'الكورس').trim();
            const fileName = isSingleLectureMode
                ? `${courseTitle} - محاضرة ${displayedLessons[0]?.lesson_number || 1}.pdf`
                : `${courseTitle} - كل المحاضرات.pdf`;

            await downloadCoursePdfFile({
                courseId,
                lessonId: isSingleLectureMode ? selectedLessonFilter : null,
                fallbackFileName: fileName,
                fallbackElement: documentRef.current
            });
        } catch (err) {
            console.error('Direct PDF generation encountered an error:', err);
            try {
                await downloadElementAsPdf(documentRef.current, fileName);
            } catch (fallbackError) {
                console.error('Client-side PDF fallback failed:', fallbackError);
                window.alert(t('PDF download failed. Please try again.', 'تعذر تنزيل ملف PDF. حاول مرة أخرى.'));
            }
        } finally {
            setIsExportingPdf(false);
            setExportProgress('');
        }
    }, [courseId, course, displayedLessons, isSingleLectureMode, selectedLessonFilter, t]);

    // Auto trigger direct PDF download if requested via ?download=true
    useEffect(() => {
        if (!loading && lessons.length > 0 && autoDownload) {
            const timer = setTimeout(() => {
                handleDirectPdfDownload();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [loading, lessons.length, autoDownload, handleDirectPdfDownload]);


    // Auto trigger print dialog if requested via ?print=true
    useEffect(() => {
        if (!loading && lessons.length > 0 && autoPrint && !autoDownload) {
            const timer = setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.print();
                }
            }, 750);
            return () => clearTimeout(timer);
        }
    }, [loading, lessons.length, autoPrint, autoDownload]);

    

    

    

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-10 h-10 rounded-full border-3 border-[#BC5C29] border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                    {t("Compiling Academic Book & Visual Schematics...", "جاري صفّ وتنسيق الكتاب الأكاديمي والرسوم التوضيحية والمراجع...")}
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                    {t("Rendering full treatise, vector flowcharts, equations, code listings, and bibliography...", "تجهيز المتن التحليلي الكامل، الخرائط المفاهيمية، الأكواد، المعادلات، وفهرس المصادر...")}
                </p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm font-bold max-w-md">
                    {error || t("Course not found", "تعذر العثور على الكورس")}
                </div>
                <Link
                    href={`/courses/${courseId}`}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold"
                >
                    {t("Back to Course", "العودة للكورس")}
                </Link>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans print:bg-white print:text-black"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* ================================================================
                TOP FLOATING CONTROL BAR (HIDDEN ON PRINT)
               ================================================================ */}
            <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 py-3 print:hidden shadow-xs">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Link
                            href={isSingleLectureMode ? `/courses/${courseId}/lessons/${displayedLessons[0].id}` : `/courses/${courseId}`}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition text-xs font-bold flex items-center gap-1.5"
                        >
                            {lang === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                            <span>{isSingleLectureMode ? t("Back to Lecture", "العودة للمحاضرة") : t("Course Workspace", "مساحة الكورس")}</span>
                        </Link>

                        <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />

                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#BC5C29] block">
                                {isSingleLectureMode
                                    ? t("Single Lecture Monograph Edition (PDF)", "كتيّب المحاضرة التفصيلي الشامل (PDF)")
                                    : t("Full Course Compendium Book (PDF)", "الموسوعة الكاملة لمحاضرات الكورس (PDF)")}
                            </span>
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white truncate max-w-[280px] sm:max-w-md">
                                {isSingleLectureMode ? displayedLessons[0]?.title : course.title}
                            </h2>
                        </div>
                    </div>

                    <div className="toolbar-actions flex items-center gap-2.5 flex-nowrap overflow-x-auto max-w-full pb-0.5">
                        {/* Filter by lecture or all */}
                        <div className="relative">
                            <select
                                value={selectedLessonFilter}
                                onChange={e => setSelectedLessonFilter(e.target.value)}
                                className="appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl ps-3 pe-8 py-1.5 text-xs font-bold outline-none cursor-pointer text-zinc-800 dark:text-zinc-200"
                            >
                                <option value="all">{t("Entire Course Book", "الكتاب الكامل للكورس")} ({lessons.length})</option>
                                {lessons.map(l => (
                                    <option key={l.id} value={String(l.id)}>
                                        {t("Monograph", "كتاب محاضرة")} #{l.lesson_number || '1'}: {l.title}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Language Switch */}
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setLang && setLang('ar')}
                                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                    lang === 'ar' ? 'bg-[#BC5C29] text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                            >
                                عربي
                            </button>
                            <button
                                type="button"
                                onClick={() => setLang && setLang('en')}
                                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                    lang === 'en' ? 'bg-[#BC5C29] text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                            >
                                EN
                            </button>
                        </div>

                        {/* Direct PDF File Download Button */}
                        <button
                            type="button"
                            onClick={handleDirectPdfDownload}
                            disabled={isExportingPdf}
                            className="px-4 py-2 rounded-xl bg-[#BC5C29] hover:bg-[#a84e20] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                            title={t("Download PDF file directly to your device", "تحميل ملف PDF مباشرة إلى جهازك")}
                        >
                            {isExportingPdf ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>{exportProgress || t("Generating PDF...", "جاري التجهيز...")}</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                <span className="whitespace-nowrap">{t("Download PDF Directly", "تنزيل PDF مباشرة")}</span>
                                </>
                            )}
                        </button>

                        {/* Browser Print / Preview Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title={t("Browser Print Dialog", "معاينة الطباعة")}
                        >
                            <Printer className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="hidden sm:inline">{t("Print", "طباعة")}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ================================================================
                MAIN BOOK DOCUMENT CONTAINER (A4 OPTIMIZED)
               ================================================================ */}
            <main
                id="book-printable-document"
                ref={documentRef}
                className="max-w-[980px] mx-auto py-8 sm:py-12 px-4 sm:px-8 space-y-12 print:p-0 print:m-0 print:max-w-none print:space-y-0 bg-white print:bg-white"
            >
                {/* Fixed running header on EVERY printed page with logo at top-left */}
                <div className="book-running-header hidden print:flex" dir="ltr">
                    <div className="flex items-center gap-2">
                        <img
                            src="/logos/image.png"
                            alt="Logo"
                            className="w-5 h-5 object-contain shrink-0"
                        />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                            ORBIT
                        </span>
                    </div>
                    <div className="text-[10px] font-sans font-semibold text-zinc-500 truncate max-w-md text-end" dir="rtl">
                        {course.title} {isSingleLectureMode ? `• ${displayedLessons[0]?.title}` : ''}
                    </div>
                </div>

                {/* ============================================================
                    1. ROYAL COVER PAGE (SHOWN FOR FULL COURSE OR SINGLE MONOGRAPH)
                   ============================================================ */}
                <section className="bg-white print:bg-white rounded-3xl border-2 border-zinc-200 print:border-4 print:border-double print:border-zinc-900 p-8 sm:p-16 text-center space-y-10 shadow-card print:shadow-none min-h-[840px] flex flex-col justify-between break-after-page">
                    {/* Top-Left Logo on Cover */}
                    <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-200 print:border-zinc-300" dir="ltr">
                        <div className="flex items-center gap-2">
                            <img
                                src="/logos/image.png"
                                alt="Orbit Logo"
                                className="w-5 h-5 object-contain shrink-0"
                            />
                            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                                ORBIT SYSTEMS
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                            Knowledge Archive
                        </span>
                    </div>

                    {/* Top Publisher Crest */}
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full bg-[#BC5C29]/10 text-[#BC5C29] border border-[#BC5C29]/30 text-xs font-mono font-bold uppercase tracking-widest">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Orbit Scholarly Press</span>
                            <span>•</span>
                            <span>{isSingleLectureMode ? 'سلسلة الكتيبات الدراسية المحققة' : 'موسوعة توثيق المقررات الأكاديمية'}</span>
                        </div>

                        {course.category_path && (
                            <p className="text-xs sm:text-sm font-bold text-zinc-500 print:text-zinc-700 tracking-wide">
                                {course.category_path}
                            </p>
                        )}

                        {isSingleLectureMode ? (
                            <div className="space-y-4 pt-4">
                                <div className="inline-block px-4 py-1 rounded-xl bg-zinc-900 text-white print:bg-black print:text-white font-mono text-sm font-black">
                                    {t("Lecture Monograph", "الكتاب المرجعي للمحاضرة")} #{displayedLessons[0]?.lesson_number || 1}
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-zinc-950 print:text-black leading-tight">
                                    {displayedLessons[0]?.title}
                                </h1>
                                <p className="text-base sm:text-lg font-bold text-[#BC5C29] pt-2">
                                    ضمن مسار: {course.title}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-4">
                                <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-zinc-950 print:text-black leading-tight">
                                    {course.title}
                                </h1>
                                <p className="text-sm sm:text-base font-medium text-zinc-600 print:text-zinc-700 max-w-2xl mx-auto leading-relaxed">
                                    {course.description
                                        ? course.description.split('\n')[0]
                                        : 'مرجع تحليلي شامل يجمع شروح المحاضرات، الخرائط المفاهيمية، الأعلام، المعاجم الاصطلاحية، والكتب المستشهد بها.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Center Geometric Ornament & Metadata Table */}
                    <div className="my-auto py-8 px-6 rounded-2xl bg-zinc-50 print:bg-zinc-50 border border-zinc-200 print:border-zinc-400 max-w-xl mx-auto w-full space-y-4 text-start">
                        <div className="text-center pb-3 border-b border-zinc-200 print:border-zinc-300">
                            <span className="text-xs font-black uppercase tracking-widest text-[#BC5C29]">
                                {t("Bibliographic & Curriculum Metadata", "البيانات التوثيقية والمنهجية للكتاب")}
                            </span>
                        </div>

                        {(course.presenter_name || course.instructor) && (
                            <div className="flex items-center justify-between text-xs sm:text-sm border-b border-zinc-200/60 pb-2.5">
                                <span className="text-zinc-500 font-bold">{t("Lecturer / Author:", "المحاضر / الشارح:")}</span>
                                <span className="font-black text-zinc-950 print:text-black">
                                    {course.presenter_name || course.instructor}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs sm:text-sm border-b border-zinc-200/60 pb-2.5">
                            <span className="text-zinc-500 font-bold">{t("Scope:", "نطاق الإصدار:")}</span>
                            <span className="font-mono font-black text-zinc-950 print:text-black">
                                {isSingleLectureMode
                                    ? `محاضرة مفردة مفصلة (#${displayedLessons[0]?.lesson_number || 1})`
                                    : `${lessons.length} محاضرة كاملة (${course.total_units || lessons.length} وحدة مقررة)`}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm border-b border-zinc-200/60 pb-2.5">
                            <span className="text-zinc-500 font-bold">{t("Duration:", "المدة الزمنية للمادة:")}</span>
                            <span className="font-mono font-black text-zinc-950 print:text-black">
                                {totalMinutes > 0
                                    ? `${(totalMinutes / 60).toFixed(1)} ساعة (${totalMinutes} دقيقة)`
                                    : 'مادة علمية موثقة بالكامل'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm border-b border-zinc-200/60 pb-2.5">
                            <span className="text-zinc-500 font-bold">{t("Cited Sources & Books:", "المراجع والمصادر الموثقة:")}</span>
                            <span className="font-mono font-black text-zinc-950 print:text-black">
                                {masterBibliography.length} مرجع ومصدر علمي
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-zinc-500 font-bold">{t("Publication Date:", "تاريخ التحرير والطباعة:")}</span>
                            <span className="font-mono font-black text-zinc-950 print:text-black">
                                {new Date().toISOString().split('T')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Cover Footer */}
                    <div className="space-y-2 text-xs text-zinc-500 border-t border-zinc-200 print:border-zinc-300 pt-6">
                        <p className="font-black text-zinc-800 print:text-black">
                            منظومة Orbit • وحدة الهندسة المعرفية والتحقيق الأكاديمي
                        </p>
                        <p className="text-[11px] font-mono">
                            يحتوي هذا الكتاب على المتن التحليلي الكامل، الخرائط المفاهيمية، الأكواد، المعادلات، والبيبليوغرافيا الشاملة
                        </p>
                    </div>
                </section>

                {/* ============================================================
                    2. TABLE OF CONTENTS (WHEN FULL COURSE IS SELECTED)
                   ============================================================ */}
                {!isSingleLectureMode && (
                    <section className="bg-white print:bg-white rounded-3xl border border-zinc-200 print:border-0 p-8 sm:p-12 space-y-6 shadow-card print:shadow-none break-after-page">
                        {/* Top-Left Small Logo Header */}
                        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-200 print:border-zinc-300" dir="ltr">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/logos/image.png"
                                    alt="Orbit Logo"
                                    className="w-5 h-5 object-contain shrink-0"
                                />
                                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                                    ORBIT SYSTEMS
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-sm" dir="rtl">
                                {course.title}
                            </span>
                        </div>

                        <div className="border-b-2 border-zinc-900 print:border-black pb-4 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#BC5C29]">
                                    Curriculum Index
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-serif font-black text-zinc-950 print:text-black">
                                    {t("Analytical Table of Contents", "الفهرس التفصيلي لفصول ومحاضرات الكتاب")}
                                </h2>
                            </div>
                            <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-zinc-100 print:border print:border-zinc-400">
                                {lessons.length} {t("Chapters", "فصول")}
                            </span>
                        </div>

                        <div className="divide-y divide-zinc-200 print:divide-zinc-300">
                            {lessons.map((lesson, idx) => {
                                const parsedSecs = parseLectureDocument(lesson.content || lesson.summary || '');
                                const resCount = (lesson.resources || []).length;
                                return (
                                    <div key={lesson.id} className="py-3.5 space-y-1.5 break-inside-avoid">
                                        <div className="flex items-center justify-between gap-4 text-sm">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded bg-[#BC5C29] text-white shrink-0">
                                                    الفصل #{lesson.lesson_number || idx + 1}
                                                </span>
                                                <span className="font-black text-zinc-950 print:text-black truncate">
                                                    {lesson.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 text-zinc-500 font-mono text-xs">
                                                {lesson.duration_minutes ? <span>{lesson.duration_minutes} د</span> : null}
                                                {resCount > 0 ? <span>• {resCount} مراجع</span> : null}
                                                <span className="font-bold text-zinc-900 print:text-black">
                                                    ص. {idx + 3}
                                                </span>
                                            </div>
                                        </div>

                                        {parsedSecs.length > 0 && (
                                            <div className="ps-16 flex flex-wrap gap-1.5">
                                                {parsedSecs.map((s, sIdx) => (
                                                    <span
                                                        key={sIdx}
                                                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 print:bg-zinc-100 text-zinc-600 print:text-zinc-700 font-medium"
                                                    >
                                                        {s.heading}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ============================================================
                    3. LECTURE CHAPTERS (COMPLETE CONTENT + DIAGRAMS + CODE + MATH + SOURCES)
                   ============================================================ */}
                {displayedLessons.map((lesson, index) => {
                    // CRITICAL FIX: Always parse the FULL treatise (lesson.content), and keep lesson.summary as Executive Abstract!
                    const fullTreatiseText = lesson.content && lesson.content.trim().length > 0
                        ? lesson.content
                        : (lesson.summary || '');
                    const hasDistinctAbstract =
                        lesson.summary &&
                        lesson.content &&
                        lesson.summary.trim().length > 0 &&
                        lesson.summary.trim() !== lesson.content.trim();

                    const sections = parseLectureDocument(fullTreatiseText);
                    const hasExplicitMermaid = sections.some(s => s.blocks.some(b => b.type === 'mermaid'));
                    const resources = lesson.resources || [];
                    const attachments = lesson.attachments || [];

                    let codeCounter = 0;
                    let diagramCounter = 0;

                    return (
                        <article
                            key={lesson.id}
                            id={`lesson-${lesson.id}`}
                            className="bg-white print:bg-white rounded-3xl border border-zinc-200 print:border-0 p-8 sm:p-12 space-y-8 shadow-card print:shadow-none break-after-page"
                        >
                            {/* Top-Left Small Logo on Every Chapter */}
                            <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-200 print:border-zinc-300" dir="ltr">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/logos/image.png"
                                        alt="Orbit Logo"
                                        className="w-5 h-5 object-contain shrink-0"
                                    />
                                    <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                                        ORBIT SYSTEMS
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400 truncate max-w-md" dir="rtl">
                                    {course.title} • {t("Lecture", "المحاضرة")} #{lesson.lesson_number || index + 1}
                                </span>
                            </div>

                            {/* ------------------------------------------------
                                CHAPTER BANNER & METADATA HEADER
                               ------------------------------------------------ */}
                            <header className="border-b-2 border-zinc-900 print:border-black pb-6 space-y-4">
                                <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-black px-3.5 py-1 rounded-lg bg-[#BC5C29] text-white">
                                            {t("Chapter / Lecture", "الفصل / المحاضرة")} #{lesson.lesson_number || index + 1}
                                        </span>
                                        <span className="text-zinc-500 font-bold">
                                            {course.title}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 font-mono text-zinc-600 print:text-zinc-700">
                                        {(course.presenter_name || course.instructor) && (
                                            <span className="flex items-center gap-1 font-bold">
                                                <User className="w-3.5 h-3.5 text-[#BC5C29]" />
                                                <span>{course.presenter_name || course.instructor}</span>
                                            </span>
                                        )}
                                        {lesson.duration_minutes && (
                                            <span className="flex items-center gap-1 font-bold">
                                                <Clock className="w-3.5 h-3.5 text-[#BC5C29]" />
                                                <span>{lesson.duration_minutes} {t("mins", "دقيقة")}</span>
                                            </span>
                                        )}
                                        {lesson.lecture_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{lesson.lecture_date}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h2 className="text-2xl sm:text-4xl font-serif font-black text-zinc-950 print:text-black leading-snug">
                                    {lesson.title}
                                </h2>

                                {lesson.description && (
                                    <p className="text-sm font-medium text-zinc-600 print:text-zinc-800 leading-relaxed">
                                        {lesson.description}
                                    </p>
                                )}

                                {lesson.source_url && (
                                    <div className="pt-1 flex items-center gap-2 text-xs font-mono text-zinc-500 print:text-zinc-700 break-all">
                                        <ExternalLink className="w-3.5 h-3.5 text-[#BC5C29] shrink-0" />
                                        <span className="font-bold">المصدر المرئي للمحاضرة:</span>
                                        <span>{lesson.source_url}</span>
                                    </div>
                                )}
                            </header>

                            {/* ------------------------------------------------
                                EXECUTIVE ABSTRACT BOX (IF DISTINCT FROM CONTENT)
                               ------------------------------------------------ */}
                            {hasDistinctAbstract && (
                                <section className="rounded-2xl bg-amber-500/5 print:bg-zinc-50 border-2 border-[#BC5C29]/30 print:border-zinc-400 p-5 space-y-2.5 break-inside-avoid">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#BC5C29] print:text-black">
                                            <Sparkles className="w-4 h-4" />
                                            <span>{t("Executive Abstract", "الملخص التنفيذي للمحاضرة (Abstract)")}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-500">بطاقة تعريفية مركزة</span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-zinc-800 print:text-black leading-relaxed space-y-1.5">
                                        {lesson.summary
                                            .split(/\r?\n/)
                                            .filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
                                            .map((line, lIdx) => (
                                                <p key={lIdx}>{renderInlineMarkdown(line.replace(/^[-*•]\s*/, '• '))}</p>
                                            ))}
                                    </div>
                                </section>
                            )}

                            {/* ------------------------------------------------
                                VISUAL CONCEPTUAL ARCHITECTURE DIAGRAM (SVG)
                               ------------------------------------------------ */}
                            {!hasExplicitMermaid && sections.length > 0 && (
                                <LectureConceptMapSvg lessonTitle={lesson.title} sections={sections} />
                            )}

                            {/* ------------------------------------------------
                                FULL ANALYTICAL SECTIONS & MULTI-BLOCK CONTENT
                               ------------------------------------------------ */}
                            <div className="space-y-10">
                                {sections.map((sec, sIdx) => {
                                    const theme = sec.theme;
                                    return (
                                        <section key={sIdx} className="space-y-4">
                                            {/* Section Heading Banner */}
                                            <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-200 print:border-zinc-400 pb-2.5 break-after-avoid">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="w-2 h-7 rounded-full shrink-0"
                                                        style={{ backgroundColor: theme.accent }}
                                                    />
                                                    <div>
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 print:text-zinc-600 block">
                                                            {lang === 'ar' ? theme.badgeAr : theme.badgeEn}
                                                        </span>
                                                        <h3 className="text-lg sm:text-xl font-serif font-black text-zinc-950 print:text-black">
                                                            {sec.heading}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-zinc-400">
                                                    § {lesson.lesson_number || index + 1}.{sIdx + 1}
                                                </span>
                                            </div>

                                            {/* Section Blocks */}
                                            <div className="space-y-4 ps-1 sm:ps-3">
                                                {sec.blocks.map((block, bIdx) => {
                                                    if (block.type === 'subheading') {
                                                        return (
                                                            <h4
                                                                key={bIdx}
                                                                className="text-base font-black text-[#BC5C29] print:text-black pt-3 flex items-center gap-2 break-after-avoid"
                                                            >
                                                                <span className="w-2 h-2 rounded-xs bg-[#BC5C29] print:bg-black shrink-0" />
                                                                <span>{renderInlineMarkdown(block.text)}</span>
                                                            </h4>
                                                        );
                                                    }

                                                    if (block.type === 'paragraph') {
                                                        return (
                                                            <p
                                                                key={bIdx}
                                                                className="text-sm sm:text-[15px] text-zinc-800 print:text-black leading-[1.9] text-justify"
                                                            >
                                                                {renderInlineMarkdown(block.text)}
                                                            </p>
                                                        );
                                                    }

                                                    if (block.type === 'quote') {
                                                        return (
                                                            <blockquote
                                                                key={bIdx}
                                                                className="my-4 p-4 rounded-2xl bg-zinc-50 print:bg-zinc-50 border-s-4 border-[#BC5C29] print:border-black italic text-sm text-zinc-800 print:text-black leading-relaxed flex items-start gap-3 break-inside-avoid"
                                                            >
                                                                <Quote className="w-5 h-5 text-[#BC5C29] shrink-0 mt-0.5" />
                                                                <div className="flex-1">{renderInlineMarkdown(block.text)}</div>
                                                            </blockquote>
                                                        );
                                                    }

                                                    if (block.type === 'mermaid') {
                                                        diagramCounter++;
                                                        return (
                                                            <BookMermaidDiagram
                                                                key={bIdx}
                                                                code={block.code}
                                                                index={diagramCounter}
                                                            />
                                                        );
                                                    }

                                                    if (block.type === 'code') {
                                                        codeCounter++;
                                                        return (
                                                            <BookCodeBlock
                                                                key={bIdx}
                                                                code={block.code}
                                                                language={block.language}
                                                                index={codeCounter}
                                                            />
                                                        );
                                                    }

                                                    if (block.type === 'equation' || block.type === 'mathplot') {
                                                        return (
                                                            <BookEquationAndPlotBlock
                                                                key={bIdx}
                                                                code={block.code}
                                                                forcePlot={block.type === 'mathplot'}
                                                            />
                                                        );
                                                    }

                                                    if (block.type === 'table') {
                                                        return (
                                                            <div
                                                                key={bIdx}
                                                                className="my-4 overflow-x-auto rounded-xl border border-zinc-300 print:border-zinc-400 break-inside-avoid"
                                                            >
                                                                <table className="w-full text-xs sm:text-sm border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-zinc-100 print:bg-zinc-200 text-zinc-900 print:text-black font-bold">
                                                                            {block.headers.map((h, hIdx) => (
                                                                                <th
                                                                                    key={hIdx}
                                                                                    className="border border-zinc-300 print:border-zinc-400 px-3 py-2 text-start"
                                                                                >
                                                                                    {renderInlineMarkdown(h)}
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {block.rows.map((row, rIdx) => (
                                                                            <tr
                                                                                key={rIdx}
                                                                                className="even:bg-zinc-50 print:even:bg-zinc-50"
                                                                            >
                                                                                {row.map((cell, cIdx) => (
                                                                                    <td
                                                                                        key={cIdx}
                                                                                        className="border border-zinc-200 print:border-zinc-300 px-3 py-2 text-zinc-800 print:text-black"
                                                                                    >
                                                                                        {renderInlineMarkdown(cell)}
                                                                                    </td>
                                                                                ))}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        );
                                                    }

                                                    if (block.type === 'list') {
                                                        // Render structured academic cards for books, figures, terms, or rich bullets
                                                        return (
                                                            <div
                                                                key={bIdx}
                                                                className={
                                                                    theme.key === 'figures' || theme.key === 'books'
                                                                        ? 'grid grid-cols-1 gap-3'
                                                                        : 'space-y-3'
                                                                }
                                                            >
                                                                {block.items.map((itemText, itIdx) => {
                                                                    const parsed = parseStructuredBullet(itemText);

                                                                    if (parsed.lead) {
                                                                        return (
                                                                            <div
                                                                                key={itIdx}
                                                                                className="p-3.5 rounded-xl bg-zinc-50/90 print:bg-zinc-50 border border-zinc-200/90 print:border-zinc-300 space-y-1.5 break-inside-avoid"
                                                                            >
                                                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span
                                                                                            className="w-2 h-2 rounded-full shrink-0"
                                                                                            style={{ backgroundColor: theme.accent }}
                                                                                        />
                                                                                        <span className="font-black text-sm sm:text-[15px] text-zinc-950 print:text-black">
                                                                                            {parsed.lead}
                                                                                        </span>
                                                                                    </div>
                                                                                    {parsed.author && (
                                                                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#BC5C29]/10 text-[#BC5C29] print:border print:border-zinc-400 print:text-black">
                                                                                            تأليف / إعداد: {parsed.author}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs sm:text-sm text-zinc-700 print:text-black leading-[1.8] ps-4">
                                                                                    {renderInlineMarkdown(parsed.body)}
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={itIdx}
                                                                            className="flex items-start gap-2.5 text-sm sm:text-[15px] text-zinc-800 print:text-black leading-[1.85] break-inside-avoid"
                                                                        >
                                                                            <span className="font-mono font-bold text-[#BC5C29] print:text-black mt-0.5 shrink-0">
                                                                                {block.ordered ? `${itIdx + 1}.` : '▪'}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                {renderInlineMarkdown(itemText)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    }

                                                    if (block.type === 'divider') {
                                                        return (
                                                            <hr
                                                                key={bIdx}
                                                                className="my-4 border-zinc-200 print:border-zinc-300"
                                                            />
                                                        );
                                                    }

                                                    return null;
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}

                                {sections.length === 0 && (
                                    <div className="text-sm text-zinc-500 italic p-6 rounded-2xl bg-zinc-50 text-center">
                                        {t("No detailed notes recorded for this lecture yet.", "لم يتم تدوين تفاصيل إضافية لهذه المحاضرة بعد.")}
                                    </div>
                                )}

                                {/* ------------------------------------------------
                                    TEACHER / RESEARCHER NOTES (IF PRESENT)
                                   ------------------------------------------------ */}
                                {lesson.private_notes && lesson.private_notes.trim().length > 0 && (
                                    <section className="pt-6 border-t-2 border-dashed border-zinc-300 space-y-3 break-inside-avoid">
                                        <div className="flex items-center gap-2 text-sm font-black text-zinc-900 print:text-black">
                                            <Award className="w-4 h-4 text-[#BC5C29]" />
                                            <span>{t("Lecturer & Researcher Margin Notes", "هوامش وملاحظات المحاضر والباحث")}</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-50 print:bg-zinc-50 border border-zinc-200 print:border-zinc-300 text-xs sm:text-sm text-zinc-800 print:text-black leading-relaxed whitespace-pre-line">
                                            {renderInlineMarkdown(lesson.private_notes)}
                                        </div>
                                    </section>
                                )}

                                {/* ------------------------------------------------
                                    REFERENCED LITERATURE, BOOKS & SOURCES
                                   ------------------------------------------------ */}
                                {resources.length > 0 && (
                                    <section className="pt-6 border-t-2 border-zinc-200 print:border-zinc-400 space-y-3 break-inside-avoid">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 print:text-black flex items-center gap-2">
                                                <Library className="w-4 h-4 text-[#BC5C29]" />
                                                <span>
                                                    {t("Bibliography & Referenced Sources in this Lecture", "ثَبْت المراجع والكتب والمصادر المستشهد بها في المحاضرة")} ({resources.length})
                                                </span>
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {resources.map((res, rIdx) => (
                                                <div
                                                    key={res.id || rIdx}
                                                    className="p-3.5 rounded-xl bg-zinc-50 print:bg-zinc-50 border border-zinc-200 print:border-zinc-300 text-xs space-y-1 break-inside-avoid"
                                                >
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-[#BC5C29] print:text-black">
                                                                [{rIdx + 1}]
                                                            </span>
                                                            <span className="font-black text-sm text-zinc-950 print:text-black">
                                                                {res.title}
                                                            </span>
                                                        </div>
                                                        {res.resource_type && (
                                                            <span className="px-2 py-0.5 rounded bg-zinc-200/80 text-[10px] font-mono font-bold uppercase text-zinc-700 print:border print:border-zinc-400">
                                                                {res.resource_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {res.description && (
                                                        <p className="text-xs text-zinc-600 print:text-zinc-800 ps-6 leading-relaxed">
                                                            {res.description}
                                                        </p>
                                                    )}
                                                    {res.url && (
                                                        <p className="text-[11px] font-mono text-zinc-500 print:text-zinc-700 ps-6 break-all">
                                                            الرابط المرجعي: {res.url}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ------------------------------------------------
                                    ATTACHED FILES & STUDY MATERIALS
                                   ------------------------------------------------ */}
                                {attachments.length > 0 && (
                                    <section className="pt-6 border-t border-zinc-200 print:border-zinc-300 space-y-3 break-inside-avoid">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 print:text-black flex items-center gap-2">
                                            <Paperclip className="w-4 h-4 text-[#BC5C29]" />
                                            <span>
                                                {t("Attached Files & Study Documents", "الملفات والمرفقات التدريبية للمحاضرة")} ({attachments.length})
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {attachments.map((att, aIdx) => (
                                                <div
                                                    key={att.id || aIdx}
                                                    className="p-3 rounded-xl bg-zinc-50 print:bg-zinc-50 border border-zinc-200 print:border-zinc-300 text-xs space-y-1"
                                                >
                                                    <p className="font-bold text-zinc-900 print:text-black">
                                                        {att.file_name}
                                                    </p>
                                                    {att.description && (
                                                        <p className="text-[11px] text-zinc-500">{att.description}</p>
                                                    )}
                                                    {att.file_url && (
                                                        <p className="text-[10px] font-mono text-zinc-400 break-all">
                                                            {att.file_url}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Chapter Footer */}
                            <footer className="pt-6 border-t border-zinc-200 print:border-zinc-300 flex items-center justify-between text-[11px] font-mono text-zinc-400 print:text-zinc-600">
                                <span>{course.title} • {lesson.title}</span>
                                <span>
                                    {t("Chapter", "الفصل")} #{lesson.lesson_number || index + 1}
                                </span>
                            </footer>
                        </article>
                    );
                })}

                {/* ============================================================
                    4. MASTER BIBLIOGRAPHY & SOURCES INDEX (END OF BOOK)
                   ============================================================ */}
                {!isSingleLectureMode && masterBibliography.length > 0 && (
                    <section className="bg-white print:bg-white rounded-3xl border border-zinc-200 print:border-0 p-8 sm:p-12 space-y-6 shadow-card print:shadow-none break-before-page">
                        {/* Top-Left Logo on Master Bibliography */}
                        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-200 print:border-zinc-300" dir="ltr">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/logos/image.png"
                                    alt="Orbit Logo"
                                    className="w-5 h-5 object-contain shrink-0"
                                />
                                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                                    ORBIT SYSTEMS
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                                Master Bibliography
                            </span>
                        </div>

                        <div className="border-b-2 border-zinc-900 print:border-black pb-4">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#BC5C29]">
                                Master Bibliography & Reference Index
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-serif font-black text-zinc-950 print:text-black">
                                {t("Complete Index of Cited Books & Sources", "الفهرس العام للكتب والمصادر والمراجع المعتمدة في المسار")}
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">
                                إجمالي المراجع الموثقة عبر فصول الكتاب: {masterBibliography.length} مرجع ومصدر علمي
                            </p>
                        </div>

                        <div className="divide-y divide-zinc-200 print:divide-zinc-300">
                            {masterBibliography.map((item, idx) => (
                                <div key={`${item.id || idx}-${idx}`} className="py-3 flex items-start justify-between gap-4 text-xs break-inside-avoid">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono font-black text-[#BC5C29] print:text-black">
                                                [{idx + 1}]
                                            </span>
                                            <span className="font-black text-sm text-zinc-950 print:text-black">
                                                {item.title}
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-mono text-zinc-600">
                                                محاضرة #{item.lessonNumber || 1}: {item.lessonTitle}
                                            </span>
                                        </div>
                                        {item.description && (
                                            <p className="text-zinc-600 print:text-zinc-800 ps-6">
                                                {item.description}
                                            </p>
                                        )}
                                        {item.url && (
                                            <p className="font-mono text-[10px] text-zinc-400 print:text-zinc-600 ps-6 break-all">
                                                {item.url}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
