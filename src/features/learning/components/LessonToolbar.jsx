'use client';

import React from 'react';
import {
    Bold,
    Italic,
    Heading2,
    Code,
    Quote,
    List,
    Sigma,
    GitGraph,
    Code2,
    Layers,
    Link as LinkIcon
} from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

export function LessonToolbar({
    onInsert,
    onInsertEquation,
    onToggleFlowchart,
    onToggleCodeBlock,
    onToggleMathPlotter,
    activePanels = {}
}) {
    const { t, lang } = useApp();

    const formattingTools = [
        {
            label: t("Bold", "نص عريض"),
            icon: Bold,
            action: () => onInsert(lang === 'ar' ? '**نص عريض**' : '**Bold text**')
        },
        {
            label: t("Italic", "نص مائل"),
            icon: Italic,
            action: () => onInsert(lang === 'ar' ? '*نص مائل*' : '*Italic text*')
        },
        {
            label: t("Heading", "عنوان فرعي"),
            icon: Heading2,
            action: () => onInsert(lang === 'ar' ? '\n### عنوان فرعي\n' : '\n### Subheading\n')
        },
        {
            label: t("Quote", "اقتباس"),
            icon: Quote,
            action: () => onInsert(lang === 'ar' ? '\n> اقتباس مهم\n' : '\n> Important quote\n')
        },
        {
            label: t("List", "قائمة نقطية"),
            icon: List,
            action: () => onInsert(lang === 'ar' ? '\n- عنصر 1\n- عنصر 2\n' : '\n- Item 1\n- Item 2\n')
        },
        {
            label: t("Link", "رابط خارجي"),
            icon: LinkIcon,
            action: () => onInsert(lang === 'ar' ? '[عنوان الرابط](https://)' : '[Link title](https://)')
        }
    ];

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-surfaceMuted/50 border border-line rounded-lg text-xs" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-center gap-1">
                {formattingTools.map((tItem, idx) => {
                    const Icon = tItem.icon;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={tItem.action}
                            title={tItem.label}
                            className="p-1.5 rounded hover:bg-surface text-inkMuted hover:text-ink transition cursor-pointer"
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={onToggleFlowchart}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer ${
                        activePanels.flowchart
                            ? 'bg-primary text-on-primary shadow-2xs'
                            : 'bg-surface border border-line text-inkSecondary hover:text-ink'
                    }`}
                >
                    <GitGraph className="w-3.5 h-3.5" />
                    <span>{t("Flowchart", "مخطط انسيابي")}</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleCodeBlock}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer ${
                        activePanels.codeBlock
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-surface border border-line text-inkSecondary hover:text-ink'
                    }`}
                >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>{t("Code Block", "كود برمجي")}</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleMathPlotter}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer ${
                        activePanels.mathPlotter
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-surface border border-line text-inkSecondary hover:text-ink'
                    }`}
                >
                    <Sigma className="w-3.5 h-3.5" />
                    <span>{t("Math Plotter", "راسم الرياضيات")}</span>
                </button>

                <button
                    type="button"
                    onClick={onInsertEquation}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-[11px] transition cursor-pointer"
                >
                    <Sigma className="w-3.5 h-3.5" />
                    <span>{t("KaTeX Equation", "معادلة KaTeX")}</span>
                </button>
            </div>
        </div>
    );
}

export default LessonToolbar;
