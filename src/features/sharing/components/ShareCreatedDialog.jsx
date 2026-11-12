'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Check, Copy, ShieldAlert, Clock, ExternalLink, X } from 'lucide-react';

const emptySubscribe = () => () => {};

export function ShareCreatedDialog({ open, onOpenChange, shareData }) {
    const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);
    const [copied, setCopied] = useState(false);

    

    if (!open || !shareData || !mounted) return null;

    const fullUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${shareData.shareUrl}`
        : shareData.shareUrl;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
            dir="rtl"
            onClick={(e) => {
                if (e.target === e.currentTarget) onOpenChange(false);
            }}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-line bg-surface text-ink shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 relative z-[1000000]"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surfaceMuted/40">
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-ok" />
                            <span>تم إنشاء رابط المشاركة بنجاح</span>
                        </h3>
                        <p className="text-[11px] text-inkMuted">
                            يمكن لأي شخص يملك هذا الرابط الوصول للقراءة فقط حتى انتهاء المدة.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="p-1 rounded-lg hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="p-3 bg-surfaceMuted rounded-xl border border-line space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-inkMuted">
                            <span className="font-semibold text-primary">الرابط المباشر المشفر:</span>
                            <span className="flex items-center gap-1 text-warn">
                                <Clock className="h-3 w-3" />
                                مؤقت
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                readOnly
                                value={fullUrl}
                                className="w-full text-[12px] bg-canvas border border-line px-3 py-2 rounded-lg font-mono text-ink select-all focus:outline-none"
                            />
                            <Button
                                size="sm"
                                variant={copied ? 'default' : 'outline'}
                                onClick={handleCopy}
                                className="shrink-0 gap-1.5 text-xs"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="p-3 bg-warn/10 border border-warn/25 rounded-lg flex items-start gap-2 text-[11.5px] text-warn">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                            تنبيه أمني: يتم عرض هذا الرابط لمرة واحدة فقط لأسباب أمنية. احرص على نسخه الآن.
                        </p>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-line bg-surfaceMuted/30 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(fullUrl, '_blank')}
                        className="text-xs gap-1.5"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        تجربة فتح الرابط
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-semibold"
                    >
                        تم وإغلاق
                    </Button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default ShareCreatedDialog;
