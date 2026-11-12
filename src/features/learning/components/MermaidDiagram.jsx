'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { GitBranch, Code2, Check, AlertCircle, Copy, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';

function sanitizeSvgMarkup(markup) {
    if (typeof window === 'undefined') return '';
    const doc = new DOMParser().parseFromString(String(markup || ''), 'image/svg+xml');
    doc.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((node) => node.remove());
    doc.querySelectorAll('*').forEach((node) => {
        [...node.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:'))) {
                node.removeAttribute(attribute.name);
            }
        });
    });
    return doc.documentElement?.outerHTML || '';
}

/**
 * Intelligent Fallback SVG Graph Renderer for Flowchart / Mermaid
 * Builds a hierarchical tree layout when Mermaid library is loading or if syntax is non-standard.
 */
function FallbackSvgTree({ code, title }) {
    const lines = (code || '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('%%') && !/^(flowchart|graph|sequenceDiagram|subgraph|end)\b/i.test(l));

    const nodesMap = new Map();
    const edges = [];

    const cleanLabel = (str) => {
        return str
            .replace(/^\[["']?|["']?\]$/g, '')
            .replace(/^\(["']?|["']?\)$/g, '')
            .replace(/^\{["']?|["']?\}$/g, '')
            .replace(/^["']|["']$/g, '')
            .trim();
    };

    const registerNode = (token) => {
        if (!token) return null;
        const match = token.match(/^([A-Za-z0-9_\u0600-\u06FF]+)\s*(?:\[\s*"?([^"\]]+)"?\s*\]|\(\s*"?([^"\)]+)"?\s*\)|\{\s*"?([^"\}]+)"?\s*\})?$/);
        if (match) {
            const id = match[1];
            const label = cleanLabel(match[2] || match[3] || match[4] || id);
            if (!nodesMap.has(id)) {
                nodesMap.set(id, { id, label, level: 0, children: [] });
            } else if (label !== id && nodesMap.get(id).label === id) {
                nodesMap.get(id).label = label;
            }
            return id;
        }
        const fallbackId = `N${nodesMap.size + 1}`;
        nodesMap.set(fallbackId, { id: fallbackId, label: cleanLabel(token), level: 0, children: [] });
        return fallbackId;
    };

    for (const line of lines) {
        const arrowMatch = line.match(/^(.*?)\s*(?:-->|---|==>|--\s*([^>-]+)\s*-->|\|([^|]+)\|)\s*(.+)$/);
        if (arrowMatch) {
            const fromId = registerNode(arrowMatch[1]);
            const edgeLabel = (arrowMatch[2] || arrowMatch[3] || '').trim();
            const toId = registerNode(arrowMatch[4]);
            if (fromId && toId) {
                edges.push({ from: fromId, to: toId, label: edgeLabel });
                if (nodesMap.has(fromId)) {
                    nodesMap.get(fromId).children.push(toId);
                }
            }
        } else {
            registerNode(line);
        }
    }

    // Determine levels (roots have in-degree 0)
    const inDegree = new Map();
    for (const [id] of nodesMap) inDegree.set(id, 0);
    for (const edge of edges) {
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    const roots = [];
    for (const [id, deg] of inDegree) {
        if (deg === 0) roots.push(id);
    }
    if (roots.length === 0 && nodesMap.size > 0) {
        roots.push(nodesMap.keys().next().value);
    }

    // BFS for levels
    const queue = roots.map(r => ({ id: r, level: 0 }));
    const visited = new Set();
    while (queue.length > 0) {
        const { id, level } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        const n = nodesMap.get(id);
        if (n) {
            n.level = level;
            for (const childId of n.children) {
                queue.push({ id: childId, level: level + 1 });
            }
        }
    }

    // Group by level
    const levelGroups = {};
    for (const node of nodesMap.values()) {
        const lvl = node.level || 0;
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(node);
    }

    const sortedLevels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);

    return (
        <div className="p-6 space-y-6 flex flex-col items-center">
            {sortedLevels.map(lvl => {
                const nodes = levelGroups[lvl];
                return (
                    <div key={lvl} className="w-full flex flex-col items-center gap-3">
                        <div className="flex flex-wrap items-center justify-center gap-4 max-w-full">
                            {nodes.map(node => {
                                const hasOutgoing = edges.some(e => e.from === node.id);
                                return (
                                    <div
                                        key={node.id}
                                        className={cn(
                                            'px-5 py-3 rounded-2xl border text-center transition-all shadow-xs min-w-[160px] max-w-[280px]',
                                            lvl === 0
                                                ? 'bg-primary/10 border-primary text-primary font-black text-sm shadow-sm'
                                                : 'bg-surface border-line text-ink font-bold text-xs hover:border-primary/50'
                                        )}
                                    >
                                        <div className="text-[10px] font-mono opacity-50 uppercase mb-0.5">{node.id}</div>
                                        <div className="leading-snug break-words">{node.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {lvl < sortedLevels.length - 1 && (
                            <div className="flex items-center justify-center py-1 text-primary animate-pulse">
                                <span className="text-xs font-black">▼</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function MermaidDiagram({ code = '', title = null, className = '' }) {
    const { t, lang } = useApp();
    const containerRef = useRef(null);
    const [svgHtml, setSvgHtml] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSource, setShowSource] = useState(false);
    const [copied, setCopied] = useState(false);
    const [zoom, setZoom] = useState(1);
    const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
    const diagramId = `mermaid_diag_${rawId}`;

    useEffect(() => {
        let isMounted = true;
        const cleanCode = String(code || '').trim();
        if (!cleanCode) {
            queueMicrotask(() => {
                if (isMounted) setLoading(false);
            });
            return;
        }

        // Clean code formatting: ensure flowchart declaration and sanitize unquoted labels
        let formattedCode = cleanCode;
        if (!/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)/i.test(formattedCode)) {
            formattedCode = `flowchart TD\n${formattedCode}`;
        }

        // Auto-quote labels containing colons or parentheses if not already quoted
        formattedCode = formattedCode.replace(/\[\s*([^"\]\n]*[:()\/،][^"\]\n]*)\s*\]/g, '["$1"]');

        async function renderDiagram() {
            try {
                const isDark = typeof document !== 'undefined' && (
                    document.documentElement.classList.contains('dark') ||
                    document.body.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches
                );

                const mermaidModule = await import('mermaid');
                const mermaid = mermaidModule.default || mermaidModule;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'base',
                    themeVariables: isDark ? {
                        darkMode: true,
                        background: 'transparent',
                        primaryColor: '#BC5C29',
                        primaryTextColor: '#ffffff',
                        primaryBorderColor: '#A34E20',
                        lineColor: '#BC5C29',
                        secondaryColor: '#18181b',
                        tertiaryColor: '#27272a',
                        mainBkg: '#1c1917',
                        nodeBorder: '#BC5C29',
                        nodeTextColor: '#f4f4f5',
                        textColor: '#f4f4f5',
                        fontFamily: 'inherit',
                        fontSize: '13px'
                    } : {
                        darkMode: false,
                        background: 'transparent',
                        primaryColor: '#BC5C29',
                        primaryTextColor: '#ffffff',
                        primaryBorderColor: '#A34E20',
                        lineColor: '#BC5C29',
                        secondaryColor: '#f4f4f5',
                        tertiaryColor: '#ffffff',
                        mainBkg: '#ffffff',
                        nodeBorder: '#BC5C29',
                        nodeTextColor: '#18181b',
                        textColor: '#18181b',
                        fontFamily: 'inherit',
                        fontSize: '13px'
                    },
                    securityLevel: 'strict',
                    flowchart: {
                        htmlLabels: false,
                        curve: 'basis',
                        padding: 15
                    }
                });

                const { svg } = await mermaid.render(diagramId, formattedCode);
                if (isMounted) {
                    setSvgHtml(sanitizeSvgMarkup(svg));
                    setError(null);
                    setLoading(false);
                }
            } catch (err) {
                console.warn('Mermaid native render warning, using structured fallback:', err);
                if (isMounted) {
                    setError(err.message || 'Render error');
                    setLoading(false);
                }
            }
        }

        renderDiagram();

        return () => {
            isMounted = false;
        };
    }, [code, diagramId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <figure
            className={cn(
                'my-6 rounded-3xl border border-line bg-surface/90 shadow-sm overflow-hidden transition-all',
                className
            )}
            dir="ltr"
        >
            {/* Top Toolbar Banner */}
            <div className="px-5 py-3 border-b border-line/70 bg-surfaceMuted/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-ink" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <GitBranch className="w-3.5 h-3.5" />
                    </div>
                    <span>{title || t("Flowchart Diagram", "مخطط تدفق وهيكلية")}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-canvas border border-line text-inkMuted uppercase">
                        Vector Diagram
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
                        className="p-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-inkMuted hover:text-ink transition cursor-pointer"
                        title={t("Zoom out", "تصغير")}
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 rounded-lg border border-line bg-surface hover:bg-canvas text-[11px] font-mono text-inkMuted hover:text-ink transition cursor-pointer"
                        title={t("Reset zoom", "إعادة ضبط")}
                    >
                        {Math.round(zoom * 100)}%
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}
                        className="p-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-inkMuted hover:text-ink transition cursor-pointer"
                        title={t("Zoom in", "تكبير")}
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-line mx-1" />

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-canvas text-inkMuted hover:text-ink transition cursor-pointer"
                        title={t("Copy Diagram Code", "نسخ كود المخطط")}
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px] font-medium">{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowSource(v => !v)}
                        className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition cursor-pointer text-[11px] font-medium',
                            showSource
                                ? 'bg-primary text-on-primary border-primary'
                                : 'border-line bg-surface hover:bg-canvas text-inkMuted hover:text-ink'
                        )}
                        title={t("Toggle source code", "تبديل عرض الكود المصدري")}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{showSource ? t("Diagram", "المخطط") : t("Code", "الكود")}</span>
                    </button>
                </div>
            </div>

            {/* Main Diagram Area */}
            {showSource ? (
                <div className="p-4 bg-canvas font-mono text-xs text-inkSecondary overflow-x-auto" dir="ltr">
                    <pre className="whitespace-pre leading-relaxed select-all">{code}</pre>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="p-6 overflow-x-auto flex items-center justify-center min-h-[180px] bg-canvas/30"
                >
                    {loading ? (
                        <div className="flex items-center gap-2 text-xs text-inkMuted py-8">
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span>{t("Rendering vector flowchart...", "جاري رسم المخطط الهيكلي...")}</span>
                        </div>
                    ) : svgHtml ? (
                        <div
                            className="mermaid-svg-container transition-transform duration-200 flex justify-center w-full"
                            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                            dangerouslySetInnerHTML={{ __html: svgHtml }}
                        />
                    ) : (
                        <FallbackSvgTree code={code} title={title} />
                    )}
                </div>
            )}
        </figure>
    );
}

export default MermaidDiagram;
