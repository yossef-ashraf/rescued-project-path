'use client';

import React, { useState } from 'react';
import { cn } from '@/shared/utils/utils.js';
import { Edit2, Eye, Copy, Check } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export function EquationBlock({
    equation = '',
    onChange,
    isEditable = true,
    className
}) {
    const { t, lang } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [rawText, setRawText] = useState(equation);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!rawText) return;
        navigator.clipboard.writeText(rawText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={cn(
                'group relative rounded-xl border border-line bg-surfaceMuted/40 p-4 transition-all',
                className
            )}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3 text-[12px] text-inkMuted">
                <span className="font-mono font-medium">LaTeX / Math Equation</span>
                <div className="flex items-center gap-1.5">
                    {isEditable && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(!isEditing)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-line hover:bg-white/5 text-ink cursor-pointer"
                        >
                            {isEditing ? <Eye className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                            <span>{isEditing ? t("Preview", "معاينة") : t("Edit", "تعديل")}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="p-1 rounded-md border border-line hover:bg-white/5 text-inkMuted hover:text-ink cursor-pointer"
                        title={t("Copy Equation", "نسخ المعادلة")}
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>

            {isEditing ? (
                <textarea
                    value={rawText}
                    onChange={(e) => {
                        setRawText(e.target.value);
                        onChange?.(e.target.value);
                    }}
                    dir="ltr"
                    placeholder="E = mc^2 \quad \text{or} \quad \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                    rows={3}
                    className="w-full font-mono text-[13px] bg-surface rounded-lg border border-line p-3 text-ink focus:outline-none focus:border-primary/50"
                />
            ) : (
                <div className="flex items-center justify-center py-4 px-2 font-mono text-[15px] text-primary overflow-x-auto text-center select-all" dir="ltr">
                    {rawText || <span className="text-inkMuted italic">{t("No equation entered", "لا توجد معادلة")}</span>}
                </div>
            )}
        </div>
    );
}

export default EquationBlock;
