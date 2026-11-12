'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

export default function SubCommentsInput({
    value = '',
    onChange,
    label,
    placeholder = 'اكتب ملاحظة أو بند فرعي...'
}) {
    const { t } = useApp();
    const inputRefs = useRef([]);
    const lastNotifiedValue = useRef(value);

    const parseNoteToItems = (val) => {
        if (!val || typeof val !== 'string') return [''];
        let normalized = val.replace(/\\n/g, '\n').replace(/\r/g, '');
        if (!normalized.includes('\n') && /\s*\/n\s*/i.test(normalized)) {
            normalized = normalized.replace(/\s*\/n\s*/gi, '\n');
        }
        const lines = normalized.split('\n');
        return lines.length > 0 ? lines : [''];
    };

    const [items, setItems] = useState(() => parseNoteToItems(value));

    useEffect(() => {
        if (value !== lastNotifiedValue.current) {
            lastNotifiedValue.current = value;
            const parsed = parseNoteToItems(value);
            setItems(parsed.length > 0 ? parsed : ['']);
        }
    }, [value]);

    const notifyChange = (newItems) => {
        setItems(newItems);
        const joined = newItems.join('\n');
        lastNotifiedValue.current = joined;
        if (onChange) {
            onChange(joined);
        }
    };

    const handleItemChange = (index, text) => {
        const newItems = [...items];
        newItems[index] = text;
        notifyChange(newItems);
    };

    const handleAddItem = (afterIndex = null) => {
        let newItems;
        let focusTarget = 0;
        if (afterIndex !== null && afterIndex >= 0) {
            newItems = [...items.slice(0, afterIndex + 1), '', ...items.slice(afterIndex + 1)];
            focusTarget = afterIndex + 1;
        } else {
            newItems = [...items, ''];
            focusTarget = newItems.length - 1;
        }
        notifyChange(newItems);

        setTimeout(() => {
            if (inputRefs.current[focusTarget]) {
                inputRefs.current[focusTarget].focus();
            }
        }, 50);
    };

    const handleRemoveItem = (index) => {
        if (items.length <= 1) {
            notifyChange(['']);
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        notifyChange(newItems);

        const prevTarget = Math.max(0, index - 1);
        setTimeout(() => {
            if (inputRefs.current[prevTarget]) {
                inputRefs.current[prevTarget].focus();
            }
        }, 50);
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem(index);
        } else if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
            e.preventDefault();
            handleRemoveItem(index);
        }
    };

    return (
        <div className="space-y-2 select-none">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    {label || t("Notes / Sub-Comments", "الملاحظات / البنود الفرعية")}
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                    {items.filter(i => i.trim() !== '').length} {t("items", "بنود")}
                </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 w-5 text-center flex-shrink-0">
                            #{idx + 1}
                        </span>
                        <input
                            ref={el => inputRefs.current[idx] = el}
                            type="text"
                            value={item}
                            onChange={e => handleItemChange(idx, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, idx)}
                            placeholder={placeholder}
                            dir="auto"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-xs font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                            title={t("Delete item", "حذف البند")}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="pt-1">
                <button
                    type="button"
                    onClick={() => handleAddItem(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t("Add Another Line", "إضافة خانة جديدة")}</span>
                </button>
            </div>
        </div>
    );
}
