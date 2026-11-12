'use client';

import React, { useState } from 'react';
import { FileText, Edit3, Eye, Sparkles, BookOpen, Clock } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';

function cleanMarkdownLine(line) {
    return line
        .replace(/^#{1,6}\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .trim();
}

export function LessonSummaryEditor({ summary, onChange, contentDir = 'rtl', durationMinutes = 45, resourcesCount = 0 }) {
    const { t, lang } = useApp();
    const [isEditing, setIsEditing] = useState(false);

    const rawText = summary || '';
    const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

    // Parse sections or bullet points for clean preview
    const previewBlocks = React.useMemo(() => {
        if (!rawText.trim()) return [];
        const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
        const blocks = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                blocks.push({ type: 'heading', text: cleanMarkdownLine(trimmed) });
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                blocks.push({ type: 'bullet', text: trimmed.slice(2).trim() });
            } else {
                blocks.push({ type: 'paragraph', text: trimmed });
            }
        }
        return blocks;
    }, [rawText]);

    const renderFormattedText = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={idx} className="font-bold text-primary">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return <span key={idx}>{part.replace(/\*(.*?)\*/g, '$1')}</span>;
        });
    };

    return (
        <div className="space-y-3 p-4 bg-surface rounded-2xl border border-line shadow-2xs" dir={contentDir}>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>{t("Executive Digest", "الملخص التنفيذي للمحاضرة")}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-inkMuted bg-surfaceMuted px-2 py-0.5 rounded-md border border-line">
                        {wordCount} {t("words", "كلمة")}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition cursor-pointer',
                            isEditing
                                ? 'bg-primary text-on-primary border-primary'
                                : 'bg-surfaceMuted text-inkSecondary border-line hover:text-ink'
                        )}
                        title={isEditing ? t("Switch to formatted view", "التبديل لوضع القراءة المنسق") : t("Edit summary text", "تعديل الملخص")}
                    >
                        {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                        <span>{isEditing ? t("Preview", "معاينة") : t("Edit", "تعديل")}</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-surfaceMuted/50 border border-line/60">
                    <div className="text-[10px] text-inkMuted">{t("Duration", "المدة")}</div>
                    <div className="text-xs font-bold text-ink mt-0.5">{durationMinutes} {t("min", "د")}</div>
                </div>
                <div className="p-2 rounded-xl bg-surfaceMuted/50 border border-line/60">
                    <div className="text-[10px] text-inkMuted">{t("References", "المراجع")}</div>
                    <div className="text-xs font-bold text-primary mt-0.5">{resourcesCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-surfaceMuted/50 border border-line/60">
                    <div className="text-[10px] text-inkMuted">{t("Length", "الحجم")}</div>
                    <div className="text-xs font-bold text-ink mt-0.5">{rawText.length} {t("ch", "حرف")}</div>
                </div>
            </div>

            {isEditing ? (
                <textarea
                    value={rawText}
                    onChange={(e) => onChange(e.target.value)}
                    dir="auto"
                    placeholder={t("Write a concise summary and key takeaways for this lesson...", "اكتب خلاصة مركزة ونقاط الارتكاز للمحاضرة...")}
                    rows={10}
                    className="w-full text-xs bg-canvas border border-line rounded-xl p-3 text-ink leading-relaxed placeholder:text-inkMuted/60 focus:outline-none focus:border-primary transition-colors resize-y"
                />
            ) : (
                <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2.5 text-xs leading-relaxed text-inkSecondary" dir="auto">
                    {previewBlocks.length === 0 ? (
                        <p className="text-inkMuted italic py-4 text-center">
                            {t("No summary available yet. Click Edit to add one.", "لا يوجد ملخص مضاف بعد. اضغط تعديل لإضافة ملخص.")}
                        </p>
                    ) : (
                        previewBlocks.map((block, i) => {
                            if (block.type === 'heading') {
                                return (
                                    <div key={i} className="pt-2 first:pt-0 font-bold text-ink border-b border-line/50 pb-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        <span>{block.text}</span>
                                    </div>
                                );
                            }
                            if (block.type === 'bullet') {
                                return (
                                    <div key={i} className="flex items-start gap-2 pl-1 pr-1 py-1 rounded-lg bg-surfaceMuted/30">
                                        <span className="text-primary font-bold mt-0.5">•</span>
                                        <div className="flex-1 leading-relaxed">{renderFormattedText(block.text)}</div>
                                    </div>
                                );
                            }
                            return (
                                <p key={i} className="leading-relaxed text-ink/90 bg-canvas/40 p-2.5 rounded-xl border border-line/40">
                                    {renderFormattedText(block.text)}
                                </p>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default LessonSummaryEditor;
