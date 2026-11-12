'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/shared/utils/utils.js';
import { EquationBlock } from './EquationBlock';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2, CloudUpload, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';

export function LessonEditor({
    lessonId,
    initialTitle = '',
    initialContent = '',
    onSave, // async (data) => boolean
    className
}) {
    const { t, lang } = useApp();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [equations, setEquations] = useState([]);
    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'draft_local' | 'error'
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const debounceTimerRef = useRef(null);
    const draftKey = `orbit_lesson_draft_${lessonId || 'new'}`;

    // Load local draft if available
    useEffect(() => {
        try {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                if (parsed.updatedAt && (!initialContent || parsed.content !== initialContent)) {
                    queueMicrotask(() => {
                        setContent(parsed.content || initialContent);
                        setTitle(parsed.title || initialTitle);
                        setEquations(parsed.equations || []);
                        setSaveStatus('draft_local');
                    });
                }
            }
        } catch (_) { }
    }, [draftKey, initialContent, initialTitle]);

    const performSave = useCallback(async (currentTitle, currentContent, currentEquations) => {
        setSaveStatus('saving');
        try {
            if (onSave) {
                await onSave({
                    id: lessonId,
                    title: currentTitle,
                    content: currentContent,
                    equations: currentEquations
                });
            }

            // Clear draft from localStorage on successful backend save
            try {
                localStorage.removeItem(draftKey);
            } catch (_) { }

            setSaveStatus('saved');
            setLastSavedAt(new Date());
        } catch (err) {
            console.error('[LessonEditor] Autosave failed, preserving draft locally:', err);
            setSaveStatus('error');
        }
    }, [lessonId, onSave, draftKey]);

    const triggerChange = useCallback((newTitle, newContent, newEquations) => {
        // 1. Immediately store draft locally
        try {
            localStorage.setItem(draftKey, JSON.stringify({
                title: newTitle,
                content: newContent,
                equations: newEquations,
                updatedAt: new Date().toISOString()
            }));
        } catch (_) { }

        setSaveStatus('draft_local');

        // 2. Debounce backend save
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            performSave(newTitle, newContent, newEquations);
        }, 1200);
    }, [draftKey, performSave]);

    // Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const addEquation = () => {
        const next = [...equations, ''];
        setEquations(next);
        triggerChange(title, content, next);
    };

    const updateEquation = (index, value) => {
        const next = [...equations];
        next[index] = value;
        setEquations(next);
        triggerChange(title, content, next);
    };

    const removeEquation = (index) => {
        const next = equations.filter((_, i) => i !== index);
        setEquations(next);
        triggerChange(title, content, next);
    };

    return (
        <div className={cn('w-full rounded-xl border border-line bg-surface flex flex-col', className)} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header / Save Status Bar */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3 bg-surfaceMuted/40">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{t("Lesson Editor", "محرر الدرس الذكي")}</span>
                    <span className="text-inkMuted text-[12px]">•</span>
                    {saveStatus === 'saving' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse font-medium">
                            <CloudUpload className="h-3.5 w-3.5" /> {t("Saving...", "جاري الحفظ...")}
                        </span>
                    )}
                    {saveStatus === 'saved' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-ok font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {t("Saved in Cloud", "تم الحفظ في السحابة")}
                        </span>
                    )}
                    {saveStatus === 'draft_local' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-warn font-medium">
                            <Save className="h-3.5 w-3.5" /> {t("Unsaved local draft", "مسودة محلية غير محفوظة")}
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-crit font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> {t("Save failed (saved offline)", "تعذر الحفظ (المسودة محفوظة محلياً)")}
                        </span>
                    )}
                </div>

                <Button
                    size="default"
                    variant="outline"
                    onClick={() => performSave(title, content, equations)}
                    disabled={saveStatus === 'saving'}
                    className="cursor-pointer"
                >
                    <Save className="h-3.5 w-3.5 shrink-0" />
                    {t("Save Now", "حفظ الآن")}
                </Button>
            </div>

            {/* Editor Body */}
            <div className="p-5 space-y-4 flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-inkMuted">
                            {t("Lesson Title", "عنوان المحاضرة أو الدرس")} <span className="text-crit font-semibold ms-1">({t('Required', 'مطلوب')} *)</span>
                        </label>
                    </div>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            triggerChange(e.target.value, content, equations);
                        }}
                        placeholder={t("Lesson or lecture title...", "عنوان الدرس أو المحاضرة...")}
                        className="w-full min-h-[48px] sm:min-h-[44px] px-3.5 rounded-xl text-[17px] font-bold bg-surfaceMuted/40 border border-line text-ink placeholder:text-inkMuted focus:outline-none focus:border-primary transition"
                    />
                </div>

                {/* Content */}
                <textarea
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        triggerChange(title, e.target.value, equations);
                    }}
                    placeholder={t("Write lesson notes and summary here...", "اكتب محتوى الدرس والملخص هنا...")}
                    rows={12}
                    className="w-full text-[13.5px] leading-relaxed bg-surfaceMuted/30 rounded-xl border border-line p-4 text-ink placeholder:text-inkMuted focus:outline-none focus:border-primary/50 resize-y"
                />

                {/* Equations Section */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-ink">{t("LaTeX / Math Equations", "المعادلات والصيغ الرياضية (KaTeX)")}</span>
                        <Button size="default" variant="ghost" onClick={addEquation} className="cursor-pointer text-primary hover:text-primary">
                            <Plus className="h-3.5 w-3.5 me-1 shrink-0" /> {t("Add Equation", "إضافة معادلة")}
                        </Button>
                    </div>

                    {equations.map((eq, idx) => (
                        <div key={idx} className="relative group">
                            <EquationBlock
                                equation={eq}
                                onChange={(val) => updateEquation(idx, val)}
                            />
                            <button
                                type="button"
                                onClick={() => removeEquation(idx)}
                                className="absolute top-2 end-2 p-1.5 rounded-md text-muted hover:text-crit hover:bg-crit/10 transition-colors cursor-pointer flex items-center justify-center"
                                title={t("Delete Equation", "حذف المعادلة")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default LessonEditor;
