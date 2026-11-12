
/* ============================================================================
 * 1. LOGO & HELPER UTILITIES
 * ============================================================================ */

let cachedLogoDataUri = null;

function getLogoDataUri() {
    // Served from the app's public assets; the PDF is compiled in the browser.
    return '/logo-mark.svg';
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function resolveFullUrl(url, origin = 'http://localhost:3000') {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return `${origin.replace(/\/$/, '')}${trimmed}`;
    return `${origin.replace(/\/$/, '')}/${trimmed}`;
}

/* ============================================================================
 * 2. LATEX / EQUATION & INLINE MARKDOWN FORMATTERS
 * ============================================================================ */

function formatLatexToHtml(tex) {
    if (!tex) return '';
    let s = escapeHtml(String(tex).trim());
    s = s
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-frac"><span class="num">$1</span><span class="den">$2</span></span>')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\sum/g, '∑')
        .replace(/\\prod/g, '∏')
        .replace(/\\int/g, '∫')
        .replace(/\\infty/g, '∞')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\delta/g, 'δ')
        .replace(/\\theta/g, 'θ')
        .replace(/\\lambda/g, 'λ')
        .replace(/\\mu/g, 'μ')
        .replace(/\\sigma/g, 'σ')
        .replace(/\\omega/g, 'ω')
        .replace(/\\pi/g, 'π')
        .replace(/\\Delta/g, 'Δ')
        .replace(/\\Omega/g, 'Ω')
        .replace(/\\leq|\\le/g, '≤')
        .replace(/\\geq|\\ge/g, '≥')
        .replace(/\\neq|\\ne/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\pm/g, '±')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\\cdot/g, '·')
        .replace(/\\rightarrow|\\to/g, ' → ')
        .replace(/\\leftarrow/g, ' ← ')
        .replace(/\\Rightarrow/g, ' ⇒ ')
        .replace(/\\Leftrightarrow/g, ' ⇔ ')
        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
        .replace(/\^([0-9a-zA-Z]+)/g, '<sup>$1</sup>')
        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
        .replace(/_([0-9a-zA-Z]+)/g, '<sub>$1</sub>');
    return s;
}

function renderInlineMarkdownHtml(text, origin = 'http://localhost:3000') {
    if (!text) return '';
    let html = escapeHtml(String(text));

    // 1. Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code" dir="ltr">$1</code>');

    // 2. Inline math $...$
    html = html.replace(/\$([^$]+)\$/g, (_, eq) => `<span class="inline-math" dir="ltr">${formatLatexToHtml(eq)}</span>`);

    // 3. Markdown links [label](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
        const full = resolveFullUrl(url, origin);
        return `<a href="${escapeHtml(full)}" class="doc-link" target="_blank">${label} ↗</a>`;
    });

    // 4. Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 5. Italic *text*
    html = html.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,؛،!؟]|$)/g, '$1<em>$2</em>');

    // 6. Bare URLs
    html = html.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2" class="doc-link" dir="ltr">$2</a>');

    return html;
}

/* ============================================================================
 * 3. VECTOR SVG DIAGRAM & MATH PLOTTER GENERATORS
 * ============================================================================ */

function renderMermaidToSvgHtml(code, index = 1) {
    const rawLines = String(code || '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('%%') && !/^(graph|flowchart|sequenceDiagram|stateDiagram)/i.test(l));

    const nodesMap = new Map();
    const edges = [];

    const cleanLabel = (str) => {
        return String(str || '')
            .replace(/^\[["']?|["']?\]$/g, '')
            .replace(/^\(["']?|["']?\)$/g, '')
            .replace(/^\{["']?|["']?\}$/g, '')
            .replace(/^["']|["']$/g, '')
            .trim();
    };

    const registerNode = (rawToken) => {
        if (!rawToken) return null;
        const t = rawToken.trim();
        const match = t.match(/^([A-Za-z0-9_\u0600-\u06FF]+)\s*(?:\[\s*"?([^"\]]+)"?\s*\]|\(\s*"?([^"\)]+)"?\s*\)|\{\s*"?([^"\}]+)"?\s*\})?$/);
        if (match) {
            const id = match[1];
            const label = cleanLabel(match[2] || match[3] || match[4] || id);
            if (!nodesMap.has(id)) {
                nodesMap.set(id, { id, label, children: [] });
            } else if (nodesMap.get(id).label === id && label !== id) {
                nodesMap.get(id).label = label;
            }
            return id;
        }
        const fallbackId = `n_${nodesMap.size + 1}`;
        nodesMap.set(fallbackId, { id: fallbackId, label: cleanLabel(t), children: [] });
        return fallbackId;
    };

    for (const line of rawLines) {
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

    const nodes = Array.from(nodesMap.values());
    if (nodes.length === 0) {
        return `<div class="diagram-box"><div class="diagram-header"><span>شكل توضيحي #${index}</span><span>Diagram</span></div><pre class="code-pre" dir="ltr">${escapeHtml(code)}</pre></div>`;
    }

    // Determine root nodes (nodes with 0 incoming edges)
    const inDegree = new Map();
    for (const [id] of nodesMap) inDegree.set(id, 0);
    for (const edge of edges) {
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    }

    const roots = [];
    for (const [id, deg] of inDegree) {
        if (deg === 0) roots.push(nodesMap.get(id));
    }
    const rootNode = roots[0] || nodes[0];

    // Check if diagram is branching
    const isBranching = nodes.some(n => n.children && n.children.length > 1);

    if (isBranching && rootNode) {
        // Hierarchical Tree Layout
        const directChildren = rootNode.children.map(cid => nodesMap.get(cid)).filter(Boolean);

        const branchesHtml = directChildren.map((branch, bIdx) => {
            const subChildren = branch.children.map(cid => nodesMap.get(cid)).filter(Boolean);
            const edge = edges.find(e => e.from === rootNode.id && e.to === branch.id);

            return `
                <div class="flow-branch-card">
                    <div class="flow-branch-header">
                        <span class="flow-branch-num">${bIdx + 1}</span>
                        <span class="flow-branch-title">${escapeHtml(branch.label)}</span>
                        ${edge?.label ? `<span class="flow-edge-badge">${escapeHtml(edge.label)}</span>` : ''}
                    </div>
                    ${subChildren.length > 0 ? `
                        <div class="flow-subitems-stack">
                            ${subChildren.map((sub, sIdx) => {
                                const subEdge = edges.find(e => e.from === branch.id && e.to === sub.id);
                                return `
                                    <div class="flow-subitem">
                                        <span class="flow-subitem-bullet">↳</span>
                                        <span class="flow-subitem-text">${escapeHtml(sub.label)}</span>
                                        ${subEdge?.label ? `<span class="flow-edge-badge">${escapeHtml(subEdge.label)}</span>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `
            <figure class="diagram-box">
                <div class="diagram-header">
                    <span class="diagram-title">⬡ مخطط هيكلي وتفرعي (شكل توضيحي #${index})</span>
                    <span class="diagram-badge">Hierarchical Flowchart</span>
                </div>
                <div class="flow-tree-wrap">
                    <div class="flow-root-box">
                        <span class="flow-root-badge">المحور الرئيسي</span>
                        <div class="flow-root-text">${escapeHtml(rootNode.label)}</div>
                    </div>
                    <div class="flow-tree-connector">
                        <div class="flow-tree-stem"></div>
                        <div class="flow-tree-arrow">▼</div>
                    </div>
                    <div class="flow-branches-grid">
                        ${branchesHtml}
                    </div>
                </div>
            </figure>
        `;
    }

    // Default Sequential Flow Layout
    const itemsHtml = nodes.map((node, idx) => {
        const edge = edges.find(e => e.from === node.id);
        const arrowDown = idx < nodes.length - 1
            ? `<div class="flow-connector">
                 <div class="flow-line"></div>
                 ${edge?.label ? `<span class="flow-edge-label">${escapeHtml(edge.label)}</span>` : ''}
                 <div class="flow-arrow-tip">▼</div>
               </div>`
            : '';
        return `
            <div class="flow-step">
                <div class="flow-node ${idx === 0 ? 'flow-node-root' : ''}">
                    <span class="flow-node-num">${idx + 1}</span>
                    <span class="flow-node-text">${escapeHtml(node.label)}</span>
                </div>
                ${arrowDown}
            </div>
        `;
    }).join('');

    return `
        <figure class="diagram-box">
            <div class="diagram-header">
                <span class="diagram-title">⬡ مخطط تدفقي ومسار مرحلي (شكل توضيحي #${index})</span>
                <span class="diagram-badge">Sequential Flowchart</span>
            </div>
            <div class="flow-container">
                ${itemsHtml}
            </div>
        </figure>
    `;
}

function renderEquationBlockHtml(code, index = 1, forcePlot = false) {
    const cleanEq = String(code || '').trim();
    let plottableExpr = null;

    if (forcePlot) {
        plottableExpr = cleanEq.replace(/^(f\(x\)|y)\s*=\s*/i, '').trim();
    } else if (/^(?:f\(x\)|y)\s*=\s*([0-9xX+\-*/^().\s]+|sin\(x\)|cos\(x\)|tan\(x\)|ln\(x\)|exp\(x\))+$/i.test(cleanEq)) {
        plottableExpr = cleanEq.replace(/^(?:f\(x\)|y)\s*=\s*/i, '').trim();
    }

    let svgPlotHtml = '';
    if (plottableExpr) {
        const width = 420;
        const height = 180;
        const cx = width / 2;
        const cy = height / 2;
        const scale = 20;
        const pts = [];

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

        for (let px = -9; px <= 9; px += 0.15) {
            const yVal = evalY(px);
            if (yVal !== null) {
                const sx = cx + px * scale;
                const sy = cy - yVal * scale;
                if (sy >= -80 && sy <= height + 80) {
                    pts.push(`${pts.length === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
                }
            }
        }

        if (pts.length > 2) {
            svgPlotHtml = `
                <div class="math-plot-wrap">
                    <div class="math-plot-caption">التمثيل البياني للدالة: f(x) = ${escapeHtml(plottableExpr)}</div>
                    <svg viewBox="0 0 ${width} ${height}" class="math-plot-svg">
                        <line x1="0" y1="${cy}" x2="${width}" y2="${cy}" stroke="#cbd5e1" stroke-width="1" />
                        <line x1="${cx}" y1="0" x2="${cx}" y2="${height}" stroke="#cbd5e1" stroke-width="1" />
                        <path d="${pts.join(' ')}" fill="none" stroke="#BC5C29" stroke-width="2.5" stroke-linecap="round" />
                    </svg>
                </div>
            `;
        }
    }

    return `
        <div class="equation-box">
            <div class="equation-header">
                <span>∑ صيغة ومعادلة رياضية (#${index})</span>
                <span class="equation-badge">Mathematical Formulation</span>
            </div>
            <div class="equation-body" dir="ltr">
                ${formatLatexToHtml(cleanEq)}
            </div>
            ${svgPlotHtml}
        </div>
    `;
}

function renderCodeBlockHtml(code, language = 'code', index = 1) {
    const lines = String(code || '').split(/\r?\n/);
    const rowsHtml = lines.map((line, idx) => `
        <div class="code-line">
            <span class="code-ln">${idx + 1}</span>
            <span class="code-txt">${escapeHtml(line) || ' '}</span>
        </div>
    `).join('');

    return `
        <div class="code-box" dir="ltr">
            <div class="code-header">
                <span class="code-lang">&lt;/&gt; ${escapeHtml(language.toUpperCase())}</span>
                <span class="code-meta">Code Listing #${index} • ${lines.length} ${lines.length === 1 ? 'line' : 'lines'}</span>
            </div>
            <div class="code-body">
                ${rowsHtml}
            </div>
        </div>
    `;
}

/* ============================================================================
 * 4. SEQUENTIAL MARKDOWN PARSER (PRESERVES 100% OF LECTURE ORDER)
 * ============================================================================ */

function parseSequentialBlocks(markdown) {
    if (!markdown || typeof markdown !== 'string') return [];

    // Clean any legacy truncated # heading on line 1 if it ends with "..."
    const rawLines = markdown.split(/\r?\n/);
    if (rawLines.length > 0 && rawLines[0].startsWith('# ') && rawLines[0].trim().endsWith('...')) {
        rawLines.shift();
    }

    const blocks = [];
    let i = 0;

    while (i < rawLines.length) {
        const line = rawLines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        // 1. Fenced Code / Mermaid / Math / Plot Blocks ```lang ... ```
        const fenceMatch = trimmed.match(/^```([a-zA-Z0-9_-]*)\s*$/);
        if (fenceMatch) {
            const lang = (fenceMatch[1] || '').toLowerCase();
            const codeLines = [];
            i++;
            while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
                codeLines.push(rawLines[i]);
                i++;
            }
            i++; // skip closing ```
            const codeContent = codeLines.join('\n');

            if (lang === 'mermaid' || lang === 'flowchart' || lang === 'diagram') {
                blocks.push({ type: 'mermaid', code: codeContent });
            } else if (lang === 'math' || lang === 'latex' || lang === 'katex' || lang === 'equation') {
                blocks.push({ type: 'math', code: codeContent, forcePlot: false });
            } else if (lang === 'plot' || lang === 'function') {
                blocks.push({ type: 'math', code: codeContent, forcePlot: true });
            } else {
                blocks.push({ type: 'code', language: lang || 'code', code: codeContent });
            }
            continue;
        }

        // 2. Display Math Block $$ ... $$
        if (trimmed.startsWith('$$')) {
            if (trimmed.endsWith('$$') && trimmed.length > 4) {
                blocks.push({ type: 'math', code: trimmed.slice(2, -2).trim(), forcePlot: false });
                i++;
                continue;
            }
            const mathLines = [trimmed.slice(2)];
            i++;
            while (i < rawLines.length && !rawLines[i].trim().endsWith('$$')) {
                mathLines.push(rawLines[i]);
                i++;
            }
            if (i < rawLines.length) {
                mathLines.push(rawLines[i].trim().slice(0, -2));
                i++;
            }
            blocks.push({ type: 'math', code: mathLines.join('\n').trim(), forcePlot: false });
            continue;
        }

        // 3. Horizontal Rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            blocks.push({ type: 'hr' });
            i++;
            continue;
        }

        // 4. Headings (#, ##, ###, ####)
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            blocks.push({ type: 'heading', level, text });
            i++;
            continue;
        }

        // 5. Markdown Table | ... |
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const tableLines = [];
            while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
                tableLines.push(rawLines[i].trim());
                i++;
            }
            const parsedRows = tableLines
                .filter(l => !/^\|[\s\-:|]+\|$/.test(l))
                .map(l => l.slice(1, -1).split('|').map(c => c.trim()));
            if (parsedRows.length > 0) {
                blocks.push({
                    type: 'table',
                    headers: parsedRows[0],
                    rows: parsedRows.slice(1)
                });
            }
            continue;
        }

        // 6. Blockquote > ...
        if (trimmed.startsWith('>')) {
            const quoteLines = [];
            while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
                quoteLines.push(rawLines[i].trim().replace(/^>\s?/, ''));
                i++;
            }
            blocks.push({ type: 'quote', text: quoteLines.join(' ') });
            continue;
        }

        // 7. Bullet or Numbered List
        if (/^(?:[-*•]|\d+[.)])\s+/.test(trimmed)) {
            const ordered = /^\d+[.)]\s+/.test(trimmed);
            const items = [];
            while (i < rawLines.length && /^(?:[-*•]|\d+[.)])\s+/.test(rawLines[i].trim())) {
                items.push(rawLines[i].trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '').trim());
                i++;
            }
            blocks.push({ type: 'list', ordered, items });
            continue;
        }

        // 8. Normal Paragraph (collect consecutive plain lines)
        const paraLines = [];
        while (
            i < rawLines.length &&
            rawLines[i].trim() &&
            !rawLines[i].trim().startsWith('#') &&
            !rawLines[i].trim().startsWith('```') &&
            !rawLines[i].trim().startsWith('$$') &&
            !rawLines[i].trim().startsWith('>') &&
            !rawLines[i].trim().startsWith('|') &&
            !/^(?:[-*•]|\d+[.)])\s+/.test(rawLines[i].trim()) &&
            !/^(-{3,}|\*{3,}|_{3,})$/.test(rawLines[i].trim())
        ) {
            paraLines.push(rawLines[i].trim());
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
        } else {
            i++;
        }
    }

    return blocks;
}

/* ============================================================================
 * 5. LECTURE VISUAL AXES FLOW (IF LECTURE HAS AXES/SUBHEADINGS)
 * ============================================================================ */

function renderLectureAxesOverviewHtml(blocks) {
    // Extract subheadings (level 2 or 3) in exact sequential order
    const axes = blocks
        .filter(b => b.type === 'heading' && (b.level === 2 || b.level === 3))
        .map(b => b.text.replace(/\*\*/g, '').trim())
        .filter(t => t.length > 2 && t.length <= 110);

    if (axes.length < 2) return '';

    const stepsHtml = axes.map((axisTitle, idx) => `
        <div class="axis-step-item">
            <span class="axis-step-num">${idx + 1}</span>
            <span class="axis-step-text">${escapeHtml(axisTitle)}</span>
        </div>
    `).join('');

    return `
        <div class="axes-overview-box">
            <div class="axes-overview-header">
                <span class="axes-overview-title">🗺️ خريطة تسلسل محاور المحاضرة (بترتيب العرض)</span>
                <span class="axes-overview-count">${axes.length} محاور رئيسية</span>
            </div>
            <div class="axes-steps-grid">
                ${stepsHtml}
            </div>
        </div>
    `;
}

/* ============================================================================
 * 6. SINGLE LECTURE RENDERER (STRICT ORDER: CONTENT -> NOTES -> BOOKS -> ATTACHMENTS)
 * ============================================================================ */

function renderLessonChapterHtml({
    lesson,
    index,
    course,
    lessonComments = [],
    isSingleLecture = false,
    logoDataUri = '',
    origin = 'http://localhost:3000'
}) {
    const lessonNum = lesson.lesson_number || index + 1;
    const blocks = parseSequentialBlocks(lesson.content || '');
    const hasDistinctSummary = lesson.summary &&
        lesson.summary.trim().length > 0 &&
        (!lesson.content || lesson.summary.trim() !== lesson.content.trim());

    let diagramCount = 0;
    let equationCount = 0;
    let codeCount = 0;

    const renderedBlocksHtml = blocks.map((b) => {
        if (b.type === 'heading') {
            if (b.level <= 2) {
                return `<h2 class="sec-h2"><span class="sec-bar"></span><span>${renderInlineMarkdownHtml(b.text, origin)}</span></h2>`;
            }
            return `<h3 class="sec-h3"><span class="sec-dot">▪</span><span>${renderInlineMarkdownHtml(b.text, origin)}</span></h3>`;
        }

        if (b.type === 'paragraph') {
            return `<p class="sec-para">${renderInlineMarkdownHtml(b.text, origin)}</p>`;
        }

        if (b.type === 'quote') {
            return `<blockquote class="sec-quote"><div class="quote-mark">❝</div><div class="quote-body">${renderInlineMarkdownHtml(b.text, origin)}</div></blockquote>`;
        }

        if (b.type === 'hr') {
            return `<hr class="sec-hr" />`;
        }

        if (b.type === 'list') {
            const tag = b.ordered ? 'ol' : 'ul';
            const listClass = b.ordered ? 'sec-list sec-list-ol' : 'sec-list sec-list-ul';
            const itemsHtml = b.items.map(item => `<li class="sec-list-item">${renderInlineMarkdownHtml(item, origin)}</li>`).join('');
            return `<${tag} class="${listClass}">${itemsHtml}</${tag}>`;
        }

        if (b.type === 'table') {
            const ths = b.headers.map(h => `<th>${renderInlineMarkdownHtml(h, origin)}</th>`).join('');
            const trs = b.rows.map(r => `<tr>${r.map(c => `<td>${renderInlineMarkdownHtml(c, origin)}</td>`).join('')}</tr>`).join('');
            return `
                <div class="table-wrap">
                    <table class="sec-table">
                        <thead><tr>${ths}</tr></thead>
                        <tbody>${trs}</tbody>
                    </table>
                </div>
            `;
        }

        if (b.type === 'mermaid') {
            diagramCount++;
            return renderMermaidToSvgHtml(b.code, diagramCount);
        }

        if (b.type === 'math') {
            equationCount++;
            return renderEquationBlockHtml(b.code, equationCount, b.forcePlot);
        }

        if (b.type === 'code') {
            codeCount++;
            return renderCodeBlockHtml(b.code, b.language, codeCount);
        }

        return '';
    }).join('\n');

    // 1. Notes & Comments Section (الملاحظات والتعليقات)
    const hasPrivateNotes = lesson.private_notes && String(lesson.private_notes).trim().length > 0;
    const hasComments = Array.isArray(lessonComments) && lessonComments.length > 0;
    let notesSectionHtml = '';

    if (hasPrivateNotes || hasComments) {
        const privateNotesBlocks = hasPrivateNotes
            ? `<div class="note-card">
                 <div class="note-card-label">📝 ملاحظات المحاضرة المسجلة:</div>
                 <div class="note-card-body">${String(lesson.private_notes).trim().split(/\r?\n/).map(line => `<p>${renderInlineMarkdownHtml(line, origin)}</p>`).join('')}</div>
               </div>`
            : '';

        const commentsHtml = hasComments
            ? lessonComments.map((c, cIdx) => `
                <div class="note-card">
                    <div class="note-card-label">💬 ملاحظة / تعليق #${cIdx + 1}:</div>
                    <div class="note-card-body">${String(c.comment || '').trim().split(/\r?\n/).map(line => `<p>${renderInlineMarkdownHtml(line, origin)}</p>`).join('')}</div>
                </div>
            `).join('')
            : '';

        notesSectionHtml = `
            <section class="addon-section">
                <h2 class="sec-h2"><span class="sec-bar"></span><span>📝 الملاحظات والتعليقات الدراسية</span></h2>
                <div class="addon-stack">
                    ${privateNotesBlocks}
                    ${commentsHtml}
                </div>
            </section>
        `;
    }

    // 2. Books & References Section (الكتب والمراجع والمصادر)
    const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
    let resourcesSectionHtml = '';

    if (resources.length > 0) {
        const resCardsHtml = resources.map((res, rIdx) => {
            const isBook = res.resource_type === 'book';
            const badgeLabel = isBook ? '📖 كتاب / مرجع أكاديمي' : '🔗 مصدر / رابط مرجعي';
            const fullUrl = res.url ? resolveFullUrl(res.url, origin) : '';
            return `
                <div class="resource-item">
                    <div class="resource-top">
                        <div class="resource-title-wrap">
                            <span class="resource-idx">${rIdx + 1}</span>
                            <strong class="resource-title">${escapeHtml(res.title)}</strong>
                        </div>
                        <span class="resource-badge">${badgeLabel}</span>
                    </div>
                    ${res.description ? `<p class="resource-desc">${renderInlineMarkdownHtml(res.description, origin)}</p>` : ''}
                    ${fullUrl ? `<div class="resource-link-row" dir="ltr"><a href="${escapeHtml(fullUrl)}" class="doc-link" target="_blank">${escapeHtml(fullUrl)} ↗</a></div>` : ''}
                </div>
            `;
        }).join('');

        resourcesSectionHtml = `
            <section class="addon-section">
                <h2 class="sec-h2"><span class="sec-bar"></span><span>📚 الكتب والمراجع والمصادر المرشحة (${resources.length})</span></h2>
                <div class="addon-stack">
                    ${resCardsHtml}
                </div>
            </section>
        `;
    }

    // 3. Uploaded Attachments & Links Section (المرفقات ولينكات الأتاش المرفوعة)
    const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];
    let attachmentsSectionHtml = '';

    if (attachments.length > 0) {
        const attCardsHtml = attachments.map((att, aIdx) => {
            const fullUrl = resolveFullUrl(att.file_url, origin);
            const sizeStr = att.file_size ? ` • ${(Number(att.file_size) / 1024).toFixed(1)} KB` : '';
            return `
                <div class="attachment-item">
                    <div class="attachment-info">
                        <span class="resource-idx">${aIdx + 1}</span>
                        <div>
                            <div class="attachment-name">📎 ${escapeHtml(att.file_name || 'ملف مرفق')}</div>
                            <div class="attachment-meta">${escapeHtml(att.file_type || 'ملف')} ${escapeHtml(sizeStr)} ${att.description ? ` — ${escapeHtml(att.description)}` : ''}</div>
                        </div>
                    </div>
                    ${fullUrl ? `<a href="${escapeHtml(fullUrl)}" class="attachment-btn" target="_blank">فتح / تحميل المرفق ↗</a>` : ''}
                </div>
            `;
        }).join('');

        attachmentsSectionHtml = `
            <section class="addon-section">
                <h2 class="sec-h2"><span class="sec-bar"></span><span>📎 المرفقات ولينكات الأتاش المرفوعة (${attachments.length})</span></h2>
                <div class="addon-stack">
                    ${attCardsHtml}
                </div>
            </section>
        `;
    }

    return `
        <article class="lecture-chapter ${!isSingleLecture && index > 0 ? 'page-break-before' : ''}">
            <!-- Top Running Header with Tiny Logo on Left -->
            <div class="page-top-bar" dir="ltr">
                <div class="brand-left">
                    ${logoDataUri ? `<img src="${logoDataUri}" alt="Orbit" class="brand-logo" />` : ''}
                    <span class="brand-name">ORBIT SYSTEMS</span>
                </div>
                <div class="brand-right" dir="rtl">
                    ${escapeHtml(course.title)} • المحاضرة #${lessonNum}
                </div>
            </div>

            <!-- Lecture Title & Metadata Banner -->
            <header class="lecture-banner">
                <div class="lecture-meta-row">
                    <div class="lecture-badges">
                        <span class="badge-primary">المحاضرة #${lessonNum}</span>
                        <span class="badge-Outline">${escapeHtml(course.title)}</span>
                    </div>
                    <div class="lecture-stats">
                        ${course.presenter_name ? `<span>🎙️ ${escapeHtml(course.presenter_name)}</span>` : ''}
                        ${lesson.duration_minutes ? `<span>⏱️ ${escapeHtml(lesson.duration_minutes)} دقيقة</span>` : ''}
                        ${lesson.lecture_date ? `<span>📅 ${escapeHtml(lesson.lecture_date)}</span>` : ''}
                    </div>
                </div>

                <h1 class="lecture-main-title">${escapeHtml(lesson.title)}</h1>

                ${lesson.description ? `<p class="lecture-subtitle">${escapeHtml(lesson.description)}</p>` : ''}

                ${lesson.source_url ? `
                    <div class="lecture-source-link">
                        <span>🔗 رابط المحاضرة الأصلي:</span>
                        <a href="${escapeHtml(resolveFullUrl(lesson.source_url, origin))}" class="doc-link" dir="ltr" target="_blank">${escapeHtml(lesson.source_url)} ↗</a>
                    </div>
                ` : ''}
            </header>

            <!-- 1. Executive Summary (if distinct) -->
            ${hasDistinctSummary ? `
                <section class="summary-callout">
                    <div class="summary-callout-header">✦ ملخص المحاضرة التنفيذي (Executive Summary)</div>
                    <div class="summary-callout-body">
                        ${String(lesson.summary).trim().split(/\r?\n/).filter(Boolean).map(l => `<p>${renderInlineMarkdownHtml(l, origin)}</p>`).join('')}
                    </div>
                </section>
            ` : ''}

            <!-- 2. Visual Axes Sequence Map -->
            ${renderLectureAxesOverviewHtml(blocks)}

            <!-- 3. Full Lecture Content in Exact Order -->
            <div class="lecture-body-content">
                ${renderedBlocksHtml || (lesson.summary ? `<p class="sec-para">${renderInlineMarkdownHtml(lesson.summary, origin)}</p>` : '<p class="sec-para">لا يوجد متن نصي مسجل لهذه المحاضرة بعد.</p>')}
            </div>

            <!-- 4. Notes & Comments -->
            ${notesSectionHtml}

            <!-- 5. Books & References -->
            ${resourcesSectionHtml}

            <!-- 6. Uploaded Attachments & Links -->
            ${attachmentsSectionHtml}
        </article>
    `;
}

/* ============================================================================
 * 7. FULL COURSE / SINGLE LECTURE HTML VIEW BUILDER
 * ============================================================================ */

export function buildCoursePdfHtmlView({
    course,
    lessons = [],
    courseMaterials = [],
    courseComments = [],
    isSingleLecture = false,
    origin = 'http://localhost:3000'
}) {
    const logoDataUri = getLogoDataUri();

    // Cover & Table of Contents (ONLY for All Lectures Compendium Mode)
    let coverAndTocHtml = '';
    if (!isSingleLecture) {
        const totalResources = lessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0) + courseMaterials.length;
        const totalAttachments = lessons.reduce((acc, l) => acc + (l.attachments?.length || 0), 0);

        const tocRowsHtml = lessons.map((l, idx) => {
            const num = l.lesson_number || idx + 1;
            const resCount = l.resources?.length || 0;
            const attCount = l.attachments?.length || 0;
            return `
                <tr>
                    <td class="toc-num">#${num}</td>
                    <td class="toc-title">
                        <div class="toc-lesson-name">${escapeHtml(l.title)}</div>
                        ${l.description ? `<div class="toc-lesson-desc">${escapeHtml(l.description)}</div>` : ''}
                    </td>
                    <td class="toc-meta">${l.duration_minutes ? `${l.duration_minutes} د` : '—'}</td>
                    <td class="toc-meta">${resCount > 0 ? `${resCount} مرجع` : '—'}${attCount > 0 ? ` • ${attCount} مرفق` : ''}</td>
                </tr>
            `;
        }).join('');

        coverAndTocHtml = `
            <section class="cover-page page-break-after">
                <div class="page-top-bar" dir="ltr">
                    <div class="brand-left">
                        ${logoDataUri ? `<img src="${logoDataUri}" alt="Orbit" class="brand-logo" />` : ''}
                        <span class="brand-name">ORBIT SYSTEMS</span>
                    </div>
                    <div class="brand-right">ACADEMIC COMPENDIUM</div>
                </div>

                <div class="cover-center">
                    <div class="cover-pill">📖 الكتاب المرجعي الشامل لجميع محاضرات الكورس</div>
                    ${course.category_path ? `<div class="cover-category">${escapeHtml(course.category_path)}</div>` : ''}
                    <h1 class="cover-title">${escapeHtml(course.title)}</h1>
                    ${course.presenter_name ? `<div class="cover-presenter">🎙️ المحاضر / الشارح: ${escapeHtml(course.presenter_name)}</div>` : ''}
                    ${course.description ? `<p class="cover-desc">${escapeHtml(course.description)}</p>` : ''}

                    <div class="cover-stats-grid">
                        <div class="cover-stat-card">
                            <div class="cover-stat-val">${lessons.length}</div>
                            <div class="cover-stat-lbl">إجمالي المحاضرات</div>
                        </div>
                        <div class="cover-stat-card">
                            <div class="cover-stat-val">${totalResources}</div>
                            <div class="cover-stat-lbl">الكتب والمراجع</div>
                        </div>
                        <div class="cover-stat-card">
                            <div class="cover-stat-val">${totalAttachments}</div>
                            <div class="cover-stat-lbl">المرفقات والملفات</div>
                        </div>
                        <div class="cover-stat-card">
                            <div class="cover-stat-val">${Math.round(Number(course.progress_percentage) || 0)}%</div>
                            <div class="cover-stat-lbl">نسبة الإنجاز</div>
                        </div>
                    </div>

                    ${course.url ? `
                        <div class="cover-source-box">
                            <span>🔗 الرابط الأصلي للكورس / القائمة:</span>
                            <a href="${escapeHtml(resolveFullUrl(course.url, origin))}" class="doc-link" dir="ltr" target="_blank">${escapeHtml(course.url)} ↗</a>
                        </div>
                    ` : ''}
                </div>

                <div class="cover-footer">
                    <span>منظومة أوربت للمعرفة والأرشفة الأكاديمية (Orbit Knowledge Engine)</span>
                    <span>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </section>

            <!-- Table of Contents Page -->
            <section class="toc-page page-break-after">
                <div class="page-top-bar" dir="ltr">
                    <div class="brand-left">
                        ${logoDataUri ? `<img src="${logoDataUri}" alt="Orbit" class="brand-logo" />` : ''}
                        <span class="brand-name">ORBIT SYSTEMS</span>
                    </div>
                    <div class="brand-right" dir="rtl">${escapeHtml(course.title)} • فهرس المحاضرات</div>
                </div>

                <h2 class="toc-heading">📑 فهرس محاضرات الكورس بترتيب العرض (${lessons.length} محاضرات)</h2>
                <div class="table-wrap">
                    <table class="sec-table toc-table">
                        <thead>
                            <tr>
                                <th style="width: 55px;">الرقم</th>
                                <th>عنوان المحاضرة والوصف</th>
                                <th style="width: 85px;">المدة</th>
                                <th style="width: 120px;">المراجع والمرفقات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tocRowsHtml}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    // Render all lessons in exact sequential order
    const chaptersHtml = lessons.map((lesson, idx) => {
        const lessonSpecificComments = courseComments.filter(c => String(c.lesson_id) === String(lesson.id));
        return renderLessonChapterHtml({
            lesson,
            index: idx,
            course,
            lessonComments: lessonSpecificComments,
            isSingleLecture,
            logoDataUri,
            origin
        });
    }).join('\n');

    // Course-level Materials & General Course Comments Appendix (if any)
    const generalCourseComments = courseComments.filter(c => !c.lesson_id);
    let courseAppendixHtml = '';
    if (courseMaterials.length > 0 || generalCourseComments.length > 0) {
        const matsHtml = courseMaterials.map((m, idx) => {
            const fullUrl = resolveFullUrl(m.file_url, origin);
            return `
                <div class="attachment-item">
                    <div class="attachment-info">
                        <span class="resource-idx">${idx + 1}</span>
                        <div>
                            <div class="attachment-name">📘 ${escapeHtml(m.file_name || 'مادة علمية مرتبطة')}</div>
                            <div class="attachment-meta">${escapeHtml(m.file_type || '')} ${m.category_name ? `• ${escapeHtml(m.category_name)}` : ''} ${m.description ? ` — ${escapeHtml(m.description)}` : ''}</div>
                        </div>
                    </div>
                    ${fullUrl ? `<a href="${escapeHtml(fullUrl)}" class="attachment-btn" target="_blank">فتح الرابط / الملف ↗</a>` : ''}
                </div>
            `;
        }).join('');

        const genCommentsHtml = generalCourseComments.map((c, idx) => `
            <div class="note-card">
                <div class="note-card-label">📌 ملاحظة عامة على الكورس #${idx + 1}:</div>
                <div class="note-card-body">${String(c.comment || '').trim().split(/\r?\n/).map(l => `<p>${renderInlineMarkdownHtml(l, origin)}</p>`).join('')}</div>
            </div>
        `).join('');

        courseAppendixHtml = `
            <section class="addon-section page-break-before">
                <div class="page-top-bar" dir="ltr">
                    <div class="brand-left">
                        ${logoDataUri ? `<img src="${logoDataUri}" alt="Orbit" class="brand-logo" />` : ''}
                        <span class="brand-name">ORBIT SYSTEMS</span>
                    </div>
                    <div class="brand-right" dir="rtl">${escapeHtml(course.title)} • الملاحق والمواد المرتبطة</div>
                </div>
                ${courseMaterials.length > 0 ? `
                    <h2 class="sec-h2"><span class="sec-bar"></span><span>📂 المواد والملفات المرجعية المرتبطة بالكورس (${courseMaterials.length})</span></h2>
                    <div class="addon-stack">${matsHtml}</div>
                ` : ''}
                ${generalCourseComments.length > 0 ? `
                    <h2 class="sec-h2"><span class="sec-bar"></span><span>📝 الملاحظات العامة على الكورس</span></h2>
                    <div class="addon-stack">${genCommentsHtml}</div>
                ` : ''}
            </section>
        `;
    }

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(course.title)}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 13mm 14mm 13mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #18181b;
            font-family: 'Segoe UI', Tahoma, 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.85;
            direction: rtl;
        }

        /* Page Breaks */
        .page-break-before {
            page-break-before: always;
            break-before: page;
        }
        .page-break-after {
            page-break-after: always;
            break-after: page;
        }

        /* Top Running Bar with Small Logo on Top-Left */
        .page-top-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 6px;
            margin-bottom: 16px;
            border-bottom: 1px solid #e4e4e7;
            direction: ltr;
        }
        .brand-left {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .brand-logo {
            width: 15px;
            height: 15px;
            object-fit: contain;
        }
        .brand-name {
            font-family: Consolas, monospace;
            font-size: 8.5pt;
            font-weight: 700;
            letter-spacing: 1.2px;
            color: #52525b;
        }
        .brand-right {
            font-size: 8.5pt;
            font-weight: 600;
            color: #71717a;
            max-width: 68%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Cover Page */
        .cover-page {
            min-height: 262mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #d4d4d8;
            border-radius: 16px;
            padding: 20px 28px;
            background: #ffffff;
        }
        .cover-center {
            text-align: center;
            margin: auto 0;
            padding: 16px 0;
        }
        .cover-pill {
            display: inline-block;
            background: #fff7ed;
            color: #BC5C29;
            border: 1px solid #fed7aa;
            padding: 5px 16px;
            border-radius: 999px;
            font-size: 9.5pt;
            font-weight: 700;
            margin-bottom: 12px;
        }
        .cover-category {
            font-size: 9.5pt;
            font-weight: 600;
            color: #71717a;
            margin-bottom: 10px;
        }
        .cover-title {
            font-size: 24pt;
            font-weight: 800;
            color: #09090b;
            line-height: 1.35;
            margin: 10px 0 14px 0;
        }
        .cover-presenter {
            display: inline-block;
            background: #f4f4f5;
            color: #27272a;
            padding: 6px 18px;
            border-radius: 10px;
            font-size: 11pt;
            font-weight: 700;
            margin-bottom: 16px;
        }
        .cover-desc {
            font-size: 10pt;
            color: #3f3f46;
            max-width: 90%;
            margin: 0 auto 22px auto;
            line-height: 1.75;
            white-space: pre-line;
        }
        .cover-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        .cover-stat-card {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 12px 8px;
            text-align: center;
        }
        .cover-stat-val {
            font-size: 16pt;
            font-weight: 800;
            color: #BC5C29;
        }
        .cover-stat-lbl {
            font-size: 8.5pt;
            font-weight: 700;
            color: #52525b;
            margin-top: 2px;
        }
        .cover-source-box {
            margin-top: 14px;
            padding: 8px 14px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            font-size: 9pt;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .cover-footer {
            display: flex;
            justify-content: space-between;
            padding-top: 12px;
            border-top: 1px solid #e4e4e7;
            font-size: 8.5pt;
            color: #71717a;
            font-weight: 600;
        }

        /* TOC */
        .toc-heading {
            font-size: 15pt;
            font-weight: 800;
            color: #09090b;
            margin: 0 0 14px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #18181b;
        }
        .toc-num {
            font-family: Consolas, monospace;
            font-weight: 800;
            color: #BC5C29;
            text-align: center;
        }
        .toc-lesson-name {
            font-weight: 700;
            color: #18181b;
            font-size: 10.5pt;
        }
        .toc-lesson-desc {
            font-size: 8.5pt;
            color: #71717a;
            margin-top: 2px;
        }
        .toc-meta {
            font-size: 9pt;
            color: #52525b;
            text-align: center;
        }

        /* Lecture Banner */
        .lecture-banner {
            background: #fafafa;
            border: 1.5px solid #e4e4e7;
            border-right: 5px solid #BC5C29;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 16px;
        }
        .lecture-meta-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 8px;
        }
        .lecture-badges {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .badge-primary {
            background: #BC5C29;
            color: #ffffff;
            font-weight: 700;
            font-size: 9pt;
            padding: 3px 10px;
            border-radius: 6px;
        }
        .badge-outline {
            background: #ffffff;
            color: #3f3f46;
            border: 1px solid #d4d4d8;
            font-weight: 700;
            font-size: 8.5pt;
            padding: 3px 10px;
            border-radius: 6px;
        }
        .lecture-stats {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 8.5pt;
            font-weight: 600;
            color: #52525b;
        }
        .lecture-main-title {
            font-size: 17pt;
            font-weight: 800;
            color: #09090b;
            margin: 4px 0 6px 0;
            line-height: 1.4;
        }
        .lecture-subtitle {
            font-size: 9.5pt;
            color: #52525b;
            margin: 0 0 6px 0;
        }
        .lecture-source-link {
            font-size: 8.5pt;
            padding-top: 6px;
            border-top: 1px dashed #d4d4d8;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #52525b;
        }

        /* Executive Summary */
        .summary-callout {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-right: 4px solid #BC5C29;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .summary-callout-header {
            font-size: 9.5pt;
            font-weight: 800;
            color: #BC5C29;
            margin-bottom: 6px;
        }
        .summary-callout-body p {
            margin: 0 0 6px 0;
            font-size: 10.5pt;
            color: #27272a;
            line-height: 1.8;
        }
        .summary-callout-body p:last-child {
            margin-bottom: 0;
        }

        /* Visual Axes Overview Box */
        .axes-overview-box {
            background: #ffffff;
            border: 1.5px solid #e4e4e7;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 18px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .axes-overview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 8px;
            margin-bottom: 10px;
            border-bottom: 1px solid #f4f4f5;
        }
        .axes-overview-title {
            font-size: 9.5pt;
            font-weight: 800;
            color: #18181b;
        }
        .axes-overview-count {
            font-size: 8.5pt;
            font-weight: 700;
            color: #BC5C29;
            background: #fff7ed;
            padding: 2px 8px;
            border-radius: 6px;
        }
        .axes-steps-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .axis-step-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 6px 10px;
        }
        .axis-step-num {
            width: 22px;
            height: 22px;
            border-radius: 6px;
            background: #BC5C29;
            color: #ffffff;
            font-size: 8.5pt;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .axis-step-text {
            font-size: 9.5pt;
            font-weight: 700;
            color: #18181b;
        }

        /* Content Headings & Typography */
        .sec-h2 {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5pt;
            font-weight: 800;
            color: #09090b;
            margin: 20px 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 1.5px solid #e4e4e7;
            page-break-after: avoid;
            break-after: avoid;
        }
        .sec-bar {
            width: 5px;
            height: 20px;
            background: #BC5C29;
            border-radius: 3px;
            flex-shrink: 0;
        }
        .sec-h3 {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11.5pt;
            font-weight: 800;
            color: #9a3412;
            margin: 14px 0 8px 0;
            page-break-after: avoid;
            break-after: avoid;
        }
        .sec-dot {
            color: #BC5C29;
            font-size: 11pt;
        }
        .sec-para {
            font-size: 11pt;
            color: #18181b;
            line-height: 1.9;
            margin: 0 0 10px 0;
        }
        .sec-list {
            margin: 6px 0 14px 0;
            padding-right: 20px;
            padding-left: 0;
        }
        .sec-list-item {
            font-size: 10.8pt;
            color: #18181b;
            line-height: 1.85;
            margin-bottom: 7px;
            padding-right: 4px;
        }
        .sec-list-item strong {
            color: #09090b;
        }
        .sec-quote {
            margin: 12px 0;
            padding: 10px 14px;
            background: #f8fafc;
            border-right: 4px solid #BC5C29;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .quote-mark {
            font-size: 16pt;
            color: #BC5C29;
            line-height: 1;
        }
        .quote-body {
            font-size: 10.5pt;
            font-style: italic;
            color: #27272a;
        }
        .sec-hr {
            border: none;
            border-top: 1px solid #e4e4e7;
            margin: 16px 0;
        }

        /* Links & Inline Elements */
        .doc-link {
            color: #BC5C29;
            text-decoration: underline;
            font-weight: 600;
            word-break: break-all;
        }
        .inline-code {
            font-family: Consolas, monospace;
            font-size: 9.5pt;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 1px 5px;
            border-radius: 4px;
            color: #0f172a;
        }
        .inline-math {
            font-family: 'Cambria Math', 'Times New Roman', serif;
            font-weight: 700;
            background: #fff7ed;
            padding: 1px 6px;
            border-radius: 4px;
            color: #9a3412;
        }

        /* Tables */
        .table-wrap {
            margin: 12px 0;
            overflow: hidden;
            border: 1px solid #d4d4d8;
            border-radius: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .sec-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
        }
        .sec-table th {
            background: #f4f4f5;
            color: #18181b;
            font-weight: 800;
            text-align: right;
            padding: 8px 10px;
            border-bottom: 1.5px solid #d4d4d8;
        }
        .sec-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e4e4e7;
            color: #27272a;
            vertical-align: top;
        }
        .sec-table tr:nth-child(even) td {
            background: #fafafa;
        }

        /* Diagrams / Flowcharts */
        /* Hierarchical Flowchart Tree */
        .flow-tree-wrap {
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #fafafa;
        }
        .flow-root-box {
            background: #fff7ed;
            border: 2px solid #BC5C29;
            border-radius: 12px;
            padding: 10px 24px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(188, 92, 41, 0.08);
            max-width: 90%;
        }
        .flow-root-badge {
            font-size: 8pt;
            font-weight: 800;
            color: #BC5C29;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 2px;
        }
        .flow-root-text {
            font-size: 11pt;
            font-weight: 800;
            color: #18181b;
        }
        .flow-tree-connector {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 3px 0 6px 0;
        }
        .flow-tree-stem {
            width: 2px;
            height: 14px;
            background: #BC5C29;
        }
        .flow-tree-arrow {
            font-size: 8pt;
            color: #BC5C29;
            line-height: 1;
        }
        .flow-branches-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            width: 100%;
        }
        .flow-branch-card {
            background: #ffffff;
            border: 1.5px solid #e4e4e7;
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .flow-branch-header {
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #f4f4f5;
            padding-bottom: 6px;
        }
        .flow-branch-num {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: #27272a;
            color: #ffffff;
            font-size: 8pt;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .flow-branch-title {
            font-size: 9.5pt;
            font-weight: 800;
            color: #18181b;
            flex: 1;
        }
        .flow-edge-badge {
            font-size: 7.5pt;
            font-weight: 600;
            background: #fff7ed;
            color: #BC5C29;
            border: 1px solid #fed7aa;
            padding: 1px 5px;
            border-radius: 4px;
        }
        .flow-subitems-stack {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding-right: 4px;
        }
        .flow-subitem {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 8.5pt;
            color: #27272a;
            line-height: 1.45;
            background: #fcfcfc;
            border: 1px solid #f4f4f5;
            padding: 4px 8px;
            border-radius: 6px;
        }
        .flow-subitem-bullet {
            color: #BC5C29;
            font-weight: 800;
            font-size: 10pt;
            line-height: 1;
        }
        .flow-subitem-text {
            flex: 1;
        }

        .diagram-box {
            margin: 14px 0;
            border: 1.5px solid #d4d4d8;
            border-radius: 12px;
            background: #ffffff;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .diagram-header {
            background: #f4f4f5;
            padding: 7px 14px;
            border-bottom: 1px solid #e4e4e7;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            font-weight: 800;
            color: #18181b;
        }
        .diagram-badge {
            font-family: Consolas, monospace;
            font-size: 8pt;
            color: #71717a;
        }
        .flow-container {
            padding: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .flow-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        .flow-node {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fafafa;
            border: 1.5px solid #27272a;
            border-radius: 10px;
            padding: 8px 16px;
            min-width: 240px;
            max-width: 85%;
        }
        .flow-node-root {
            background: #fff7ed;
            border-color: #BC5C29;
        }
        .flow-node-num {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #BC5C29;
            color: #ffffff;
            font-size: 8pt;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .flow-node-text {
            font-size: 10pt;
            font-weight: 700;
            color: #18181b;
        }
        .flow-connector {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 2px 0;
        }
        .flow-line {
            width: 2px;
            height: 12px;
            background: #BC5C29;
        }
        .flow-edge-label {
            font-size: 8pt;
            color: #52525b;
            background: #f4f4f5;
            padding: 1px 6px;
            border-radius: 4px;
        }
        .flow-arrow-tip {
            font-size: 8pt;
            color: #BC5C29;
            line-height: 1;
        }

        /* Equations & Mathematical Plots */
        .equation-box {
            margin: 14px 0;
            border: 1.5px solid #fed7aa;
            border-radius: 12px;
            background: #fffbeb;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .equation-header {
            background: #ffedd5;
            padding: 6px 14px;
            border-bottom: 1px solid #fed7aa;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            font-weight: 800;
            color: #9a3412;
        }
        .equation-badge {
            font-family: Consolas, monospace;
            font-size: 8pt;
            color: #b45309;
        }
        .equation-body {
            padding: 12px 16px;
            text-align: center;
            font-family: 'Cambria Math', 'Times New Roman', serif;
            font-size: 13pt;
            font-weight: 700;
            color: #18181b;
        }
        .math-frac {
            display: inline-flex;
            flex-direction: column;
            vertical-align: middle;
            text-align: center;
            padding: 0 4px;
        }
        .math-frac .num {
            border-bottom: 1px solid #18181b;
            padding-bottom: 1px;
        }
        .math-plot-wrap {
            padding: 10px 14px;
            border-top: 1px dashed #fed7aa;
            text-align: center;
            background: #ffffff;
        }
        .math-plot-caption {
            font-family: Consolas, monospace;
            font-size: 8.5pt;
            color: #52525b;
            margin-bottom: 6px;
        }
        .math-plot-svg {
            width: 100%;
            max-width: 380px;
            height: 150px;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            background: #ffffff;
        }

        /* Code Blocks */
        .code-box {
            margin: 14px 0;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            background: #f8fafc;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .code-header {
            background: #e2e8f0;
            padding: 6px 12px;
            border-bottom: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-family: Consolas, monospace;
            font-size: 8.5pt;
            color: #0f172a;
        }
        .code-lang {
            font-weight: 800;
            color: #BC5C29;
        }
        .code-body {
            padding: 8px 0;
            font-family: Consolas, 'Courier New', monospace;
            font-size: 9pt;
            line-height: 1.55;
        }
        .code-line {
            display: flex;
            padding: 0 12px;
        }
        .code-ln {
            width: 28px;
            color: #94a3b8;
            text-align: right;
            padding-right: 10px;
            user-select: none;
            flex-shrink: 0;
        }
        .code-txt {
            white-space: pre-wrap;
            word-break: break-all;
            color: #0f172a;
        }

        /* Notes, Books & Attachments Addon Sections */
        .addon-section {
            margin-top: 22px;
            padding-top: 10px;
        }
        .addon-stack {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .note-card {
            background: #fefce8;
            border: 1px solid #fef08a;
            border-right: 4px solid #eab308;
            border-radius: 10px;
            padding: 10px 14px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .note-card-label {
            font-size: 9.5pt;
            font-weight: 800;
            color: #854d0e;
            margin-bottom: 4px;
        }
        .note-card-body p {
            margin: 0 0 4px 0;
            font-size: 10pt;
            color: #18181b;
        }

        .resource-item {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-right: 4px solid #BC5C29;
            border-radius: 10px;
            padding: 10px 14px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .resource-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 4px;
        }
        .resource-title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .resource-idx {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            background: #BC5C29;
            color: #ffffff;
            font-size: 8.5pt;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .resource-title {
            font-size: 10.5pt;
            color: #09090b;
        }
        .resource-badge {
            font-size: 8pt;
            font-weight: 700;
            background: #fff7ed;
            color: #BC5C29;
            border: 1px solid #fed7aa;
            padding: 2px 8px;
            border-radius: 6px;
            flex-shrink: 0;
        }
        .resource-desc {
            font-size: 9.5pt;
            color: #3f3f46;
            margin: 4px 0 0 0;
            line-height: 1.7;
        }
        .resource-link-row {
            margin-top: 6px;
            font-size: 8.5pt;
        }

        .attachment-item {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .attachment-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .attachment-name {
            font-size: 10pt;
            font-weight: 800;
            color: #0f172a;
        }
        .attachment-meta {
            font-size: 8.5pt;
            color: #64748b;
        }
        .attachment-btn {
            background: #BC5C29;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 8.5pt;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 6px;
            flex-shrink: 0;
        }
    </style>
</head>
<body>
    ${coverAndTocHtml}
    ${chaptersHtml}
    ${courseAppendixHtml}
</body>
</html>`;
}

/* ============================================================================
 * 8. PDF COMPILATION
 * The hosted runtime has no headless browser, so the HTML view is returned to the
 * browser, which compiles the PDF (see features/learning/utils/pdfClientDownload.js).
 * ============================================================================ */

export async function renderHtmlViewToPdfBuffer() {
    const err = new Error('Server-side PDF rendering is not available; the browser compiles the PDF.');
    err.status = 501;
    throw err;
}
