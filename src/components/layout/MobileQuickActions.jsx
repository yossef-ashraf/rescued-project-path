'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import { X, CheckSquare, WalletCards, Users, FileText, BookOpen, Wrench } from 'lucide-react';

const actions = [
    { id: 'task', en: 'New Task', ar: 'مهمة جديدة', href: '/tasks/todo', icon: CheckSquare, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'expense', en: 'Expense', ar: 'التزام / مصروف', href: '/debts', icon: WalletCards, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'client', en: 'Client Lead', ar: 'عميل جديد', href: '/leads', icon: Users, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    { id: 'tool', en: 'Tool / Util', ar: 'أداة مساعدة', href: '/courses/materials?type=tools', icon: Wrench, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { id: 'summary', en: 'Summary', ar: 'ملخص / ملاحظة', href: '/courses/materials?type=summary', icon: FileText, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { id: 'course', en: 'Add Course', ar: 'إضافة كورس', href: '/courses/add-course', icon: BookOpen, color: 'text-[#BC5C29] bg-[#BC5C29]/10 border-[#BC5C29]/20' }
];

export default function MobileQuickActions({ open, onClose }) {
    const { t, theme } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const goTo = (href) => {
        onClose();
        router.push(href);
    };

    const isLight = theme === 'light' || theme === 'mode-light';

    return (
        <div className="lg:hidden fixed inset-0 z-[60] flex items-end animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={t('Quick Actions', 'إجراءات سريعة')}>
            <button className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} aria-label={t('Close quick add', 'إغلاق الإضافة السريعة')} />
            <div className={`relative w-full rounded-t-[32px] border-t p-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] shadow-2xl transition-all duration-200 ${
                isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
            }`}>
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-base font-black tracking-tight">{t('Quick Actions', 'إجراءات سريعة')}</p>
                        <p className="mt-0.5 text-xs text-muted">{t('Jump straight to creation', 'ابدأ إنشاء أي عنصر بلمسة واحدة')}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-line2 transition cursor-pointer" aria-label={t('Close', 'إغلاق')}>
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                    {actions.map(({ id, en, ar, href, icon: Icon, color }) => (
                        <button
                            key={id}
                            onClick={() => goTo(href)}
                            className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface hover:bg-line2/70 p-2 text-center transition active:scale-95 shadow-2xs cursor-pointer"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
                                <Icon className="h-4 w-4 stroke-[2]" />
                            </div>
                            <span className="text-[11.5px] font-bold truncate max-w-full leading-tight">{t(en, ar)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
