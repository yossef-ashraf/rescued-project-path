'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, Play, Terminal, FileText } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

const SUPPORTED_LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML / JSX' },
    { value: 'cpp', label: 'C++' },
    { value: 'css', label: 'CSS' }
];

export function InteractiveCodeBlock({
    initialCode = null,
    initialLanguage = 'javascript',
    onChange = null,
    onInsert = null,
    className = ''
}) {
    const { t, lang } = useApp();

    const defaultCode = lang === 'ar'
        ? `// اكتب الكود البرمجي هنا\nfunction calculateProgress(completed, total) {\n    if (total <= 0) return 0;\n    return Math.round((completed / total) * 100);\n}\n\nconsole.log(calculateProgress(5, 10));`
        : `// Write code here\nfunction calculateProgress(completed, total) {\n    if (total <= 0) return 0;\n    return Math.round((completed / total) * 100);\n}\n\nconsole.log(calculateProgress(5, 10));`;

    const [code, setCode] = useState(initialCode || defaultCode);
    const [language, setLanguage] = useState(initialLanguage);
    const [copied, setCopied] = useState(false);
    const [inserted, setInserted] = useState(false);
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInsertCode = () => {
        const snippet = `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
        if (onInsert) {
            onInsert(snippet);
            setInserted(true);
            setTimeout(() => setInserted(false), 2000);
        }
    };

    // Never evaluate editor content in the application context. A Function/eval sandbox
    // is not a security boundary and would allow access to browser capabilities.
    const handleRunJs = () => {
        setOutput(t(
            "Running user JavaScript is disabled for security. Copy the code to a trusted local sandbox to execute it.",
            "تم تعطيل تشغيل JavaScript لأسباب أمنية. انسخ الكود إلى بيئة sandbox موثوقة لتشغيله."
        ));
        setIsRunning(false);
    };

    const linesCount = code.split('\n').length;

    return (
        <div className={`p-4 bg-surface rounded-2xl border border-line space-y-3 ${className}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-ink">
                        {t("Interactive Code Studio", "محرر ومفسر الكود التفاعلي")}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value);
                            setOutput(null);
                        }}
                        dir="ltr"
                        className="text-xs bg-canvas border border-line rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:border-primary font-mono cursor-pointer"
                    >
                        {SUPPORTED_LANGUAGES.map(item => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>

                    {language === 'javascript' && (
                        <button
                            type="button"
                            onClick={handleRunJs}
                            disabled={isRunning}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={t("Run JavaScript Code", "تشغيل كود JavaScript")}
                        >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{t("Run Code", "تشغيل الكود")}</span>
                        </button>
                    )}

                    {onInsert && (
                        <button
                            type="button"
                            onClick={handleInsertCode}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                                inserted
                                    ? 'bg-ok text-white'
                                    : 'bg-primary text-on-primary hover:opacity-90'
                            }`}
                            title={t("Insert formatted code block into lesson content", "إدراج قالب الكود داخل محتوى المحاضرة")}
                        >
                            {inserted ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            <span>{inserted ? t("Inserted!", "تم الإدراج!") : t("Insert into Notes", "إدراج في الملاحظات")}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="px-2.5 py-1 rounded-lg border border-line hover:bg-surfaceMuted text-xs text-ink transition flex items-center gap-1 cursor-pointer"
                        title={t("Copy Code", "نسخ الكود")}
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</span>
                    </button>
                </div>
            </div>

            {/* Code Editor Container */}
            <div className="rounded-xl border border-line bg-zinc-950 text-zinc-100 font-mono text-xs overflow-hidden flex" dir="ltr">
                {/* Line numbers column */}
                <div className="py-3 px-2 bg-zinc-900 border-r border-zinc-800 text-zinc-600 select-none text-right font-mono text-[11px] min-w-8">
                    {Array.from({ length: Math.max(linesCount, 5) }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                </div>

                {/* Editor Textarea */}
                <textarea
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value);
                        if (onChange) onChange(e.target.value, language);
                    }}
                    rows={Math.max(6, Math.min(linesCount + 1, 18))}
                    className="w-full bg-transparent p-3 outline-none text-emerald-400 placeholder:text-zinc-600 font-mono resize-y leading-relaxed text-[12.5px]"
                    placeholder={lang === 'ar' ? '// اكتب كودك هنا...' : '// Write code here...'}
                    spellCheck="false"
                />
            </div>

            {/* Execution Output Console */}
            {output !== null && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5" dir="ltr">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80 pb-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{lang === 'ar' ? 'مخرجات الكونسول:' : 'Console Output:'}</span>
                    </div>
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                        {output}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default InteractiveCodeBlock;
