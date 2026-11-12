'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export default function SubCommentsList({ note, maxPreview = 2 }) {
    const { t } = useApp();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!note || typeof note !== 'string' || !note.trim()) {
        return <span className="text-zinc-300 dark:text-zinc-700">-</span>;
    }

    let normalized = note.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
    if (!normalized.includes('\n') && /\s*\/n\s*/i.test(normalized)) {
        normalized = normalized.replace(/\s*\/n\s*/gi, '\n');
    }
    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length === 0) {
        return <span className="text-zinc-300 dark:text-zinc-700">-</span>;
    }

    if (lines.length === 1) {
        return (
            <div className="text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
                {lines[0]}
            </div>
        );
    }

    const visibleLines = isExpanded ? lines : lines.slice(0, maxPreview);
    const hiddenCount = lines.length - maxPreview;

    return (
        <div className="space-y-1.5 max-w-xs" dir="auto" style={{ unicodeBidi: 'plaintext' }}>
            <div className="space-y-1">
                {visibleLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 mt-1.5 flex-shrink-0" />
                        <span className="line-clamp-2">{line}</span>
                    </div>
                ))}
            </div>

            {lines.length > maxPreview && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer select-none pt-0.5"
                >
                    {isExpanded ? (
                        <>
                            <span>{t("Show Less", "عرض أقل")}</span>
                            <ChevronUp className="w-3 h-3" />
                        </>
                    ) : (
                        <>
                            <span>+{hiddenCount} {t("more", "المزيد")}</span>
                            <ChevronDown className="w-3 h-3" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
