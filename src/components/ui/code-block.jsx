'use client';

import React, { useState, useMemo } from 'react';
import { Check, Copy, File, FileCode, FileText, Terminal } from 'lucide-react';

const KEYWORDS = new Set([
    'export', 'import', 'from', 'const', 'let', 'var', 'function', 'return',
    'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
    'default', 'class', 'extends', 'new', 'async', 'await', 'try', 'catch',
    'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'interface',
    'type', 'enum', 'implements', 'public', 'private', 'protected', 'readonly',
    'true', 'false', 'null', 'undefined', 'void', 'def', 'elif', 'lambda',
    'select', 'where', 'insert', 'into', 'update', 'delete', 'join', 'order', 'by', 'group'
]);

function highlightLine(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('# ') || trimmed.startsWith('--')) {
        return <span className="text-zinc-400 dark:text-zinc-500 italic">{line}</span>;
    }

    const tokenRegex = /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b[A-Za-z_]\w*(?=\s*:)|\b[A-Za-z_]\w*(?=\s*\()|\b[A-Za-z_]\w*\b|\b\d+(?:\.\d+)?\b|[{}()[\].,:;+-/*=<>!&|]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index));
        }
        const token = match[0];
        const afterToken = line.slice(match.index + token.length);

        if (
            (token.startsWith("'") && token.endsWith("'")) ||
            (token.startsWith('"') && token.endsWith('"')) ||
            (token.startsWith('`') && token.endsWith('`'))
        ) {
            parts.push(
                <span key={match.index} className="text-[#15803D] dark:text-emerald-400">
                    {token}
                </span>
            );
        } else if (KEYWORDS.has(token) || KEYWORDS.has(token.toLowerCase())) {
            parts.push(
                <span key={match.index} className="text-[#9333EA] dark:text-purple-400 font-medium">
                    {token}
                </span>
            );
        } else if (/^\s*:/.test(afterToken)) {
            parts.push(
                <span key={match.index} className="text-[#2563EB] dark:text-sky-400">
                    {token}
                </span>
            );
        } else if (/^\s*\(/.test(afterToken)) {
            parts.push(
                <span key={match.index} className="text-[#E45C3A] dark:text-orange-400">
                    {token}
                </span>
            );
        } else if (/^\d+(\.\d+)?$/.test(token)) {
            parts.push(
                <span key={match.index} className="text-[#9333EA] dark:text-purple-400">
                    {token}
                </span>
            );
        } else {
            parts.push(
                <span key={match.index} className="text-zinc-800 dark:text-zinc-200">
                    {token}
                </span>
            );
        }
        lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
    }

    return parts.length > 0 ? parts : line;
}

function FileIcon({ fileName = '' }) {
    const ext = String(fileName).split('.').pop()?.toLowerCase();
    if (['sh', 'bash', 'zsh', 'cmd', 'ps1'].includes(ext)) {
        return <Terminal className="w-3.5 h-3.5 shrink-0" />;
    }
    if (['css', 'scss', 'md', 'txt'].includes(ext)) {
        return <FileText className="w-3.5 h-3.5 shrink-0" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'sql', 'go', 'rs', 'php'].includes(ext)) {
        return <FileCode className="w-3.5 h-3.5 shrink-0" />;
    }
    return <FileCode className="w-3.5 h-3.5 shrink-0" />;
}

export function CodeBlock({ files = [], defaultTitle, className = '', maxHeight = '320px' }) {
    const normalizedFiles = useMemo(() => {
        if (!Array.isArray(files) || files.length === 0) {
            return [{ title: 'snippet.ts', code: '' }];
        }
        return files.map((f, idx) => ({
            title: f.title || f.language || `snippet-${idx + 1}.ts`,
            code: String(f.code || ''),
            language: f.language || 'typescript'
        }));
    }, [files]);

    const [activeTitle, setActiveTitle] = useState(
        defaultTitle || normalizedFiles[0]?.title || 'snippet.ts'
    );
    const [copied, setCopied] = useState(false);

    const activeFile =
        normalizedFiles.find((file) => file.title === activeTitle) || normalizedFiles[0];
    const code = activeFile?.code || '';

    const copyToClipboard = async (e) => {
        if (e) e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const lines = code.split(/\r?\n/);

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs text-start ${className}`}
            dir="ltr"
        >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 px-3.5 py-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {normalizedFiles.map(({ title }) => {
                        const isActive = title === activeFile?.title;
                        return (
                            <button
                                key={title}
                                type="button"
                                onClick={() => setActiveTitle(title)}
                                className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                                    isActive
                                        ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
                                }`}
                            >
                                <FileIcon fileName={title} />
                                <span>{title}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={copyToClipboard}
                    title={copied ? 'Copied!' : 'Copy code'}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>

            <div className="overflow-auto p-3.5" style={{ maxHeight }}>
                <pre className="m-0 font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                    <code>
                        {lines.map((line, idx) => (
                            <div key={idx} className="min-h-[1.25rem] whitespace-pre">
                                {highlightLine(line)}
                            </div>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    );
}

export function formatCodeSubmission(code, title = 'snippet.ts') {
    const cleanTitle = (title || 'snippet.ts').trim();
    return `\`\`\`${cleanTitle}\n${String(code || '').trim()}\n\`\`\``;
}

export function parseSmartContent(rawContent) {
    const text = String(rawContent || '').trim();
    if (!text) return [];

    const fenceRegex = /```([^\n`]*)\n([\s\S]*?)```/g;
    const segments = [];
    let lastIdx = 0;
    let match;

    while ((match = fenceRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
            const prose = text.slice(lastIdx, match.index).trim();
            if (prose) segments.push({ type: 'text', content: prose });
        }
        const meta = (match[1] || '').trim() || 'snippet.ts';
        const code = (match[2] || '').replace(/\n$/, '');

        const prev = segments[segments.length - 1];
        if (prev && prev.type === 'code') {
            prev.files.push({ title: meta, code });
        } else {
            segments.push({
                type: 'code',
                files: [{ title: meta, code }]
            });
        }
        lastIdx = match.index + match[0].length;
    }

    if (segments.length > 0) {
        if (lastIdx < text.length) {
            const tail = text.slice(lastIdx).trim();
            if (tail) segments.push({ type: 'text', content: tail });
        }
        return segments;
    }

    const codeIndicators = [
        /^\s*(export|import|const|let|var|function|class|interface|type|def|SELECT|INSERT|UPDATE|DELETE)\b/m,
        /[{};]\s*$/m,
        /^\s*(npm|pnpm|yarn|npx|git|docker|curl|ssh|sudo)\s+/m
    ];
    const looksLikeCode =
        text.includes('\n') && codeIndicators.some((rx) => rx.test(text));

    if (looksLikeCode) {
        let inferredTitle = 'snippet.ts';
        if (/^\s*(npm|pnpm|yarn|npx|git|docker|curl|ssh|sudo)\s+/m.test(text)) {
            inferredTitle = 'commands.sh';
        } else if (/^\s*\.[a-zA-Z0-9_-]+\s*\{/m.test(text)) {
            inferredTitle = 'styles.css';
        } else if (/^\s*\{[\s\S]*"[\w-]+":/m.test(text)) {
            inferredTitle = 'config.json';
        }
        return [{ type: 'code', files: [{ title: inferredTitle, code: text }] }];
    }

    return [{ type: 'text', content: text }];
}

export function SmartCommentBlock({ content, text, className = '', maxHeight = '260px', preview = false }) {
    const rawText = content || text || '';
    const segments = useMemo(() => parseSmartContent(rawText), [rawText]);

    if (segments.length === 0) return null;

    const displaySegments = preview ? segments.slice(0, 1) : segments;

    return (
        <div className={`space-y-2 ${className}`}>
            {displaySegments.map((seg, idx) =>
                seg.type === 'code' ? (
                    <CodeBlock 
                        key={idx} 
                        files={preview ? seg.files.slice(0, 1) : seg.files} 
                        maxHeight={preview ? (parseInt(maxHeight, 10) < 100 ? maxHeight : '90px') : maxHeight} 
                    />
                ) : (
                    <p
                        key={idx}
                        dir="auto"
                        className={`text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed ${preview ? 'line-clamp-3 whitespace-pre-line' : 'whitespace-pre-wrap'}`}
                    >
                        {seg.content}
                    </p>
                )
            )}
        </div>
    );
}

export default CodeBlock;
