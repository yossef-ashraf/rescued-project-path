'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Check, Clock, Eye, AlertCircle } from 'lucide-react';

export function ShareLinksTable({ links = [], onRevoke, onRenew, loading = false }) {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (id, shareUrl) => {
        const full = typeof window !== 'undefined' ? `${window.location.origin}${shareUrl}` : shareUrl;
        navigator.clipboard.writeText(full);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="py-8 text-center text-[13px] text-inkMuted animate-pulse">
                جاري تحميل روابط المشاركة النشطة...
            </div>
        );
    }

    if (!links || links.length === 0) {
        return (
            <div className="py-8 text-center text-[12.5px] text-inkMuted border border-dashed border-line rounded-xl">
                لا توجد روابط مشاركة نشطة حالياً.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border border-line rounded-xl" dir="rtl">
            <table className="w-full text-right text-[12.5px]">
                <thead className="bg-surfaceMuted/50 text-inkMuted border-b border-line text-[11px] font-semibold">
                    <tr>
                        <th className="py-2.5 px-3">النوع</th>
                        <th className="py-2.5 px-3">المعرف</th>
                        <th className="py-2.5 px-3">المشاهدات</th>
                        <th className="py-2.5 px-3">تاريخ الانتهاء</th>
                        <th className="py-2.5 px-3 text-left">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                    {links.map((link) => {
                        const isExpired = new Date(link.expiresAt) <= new Date();
                        return (
                            <tr key={link.id} className="hover:bg-surfaceMuted/30 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-primary">
                                    {link.entityType}
                                </td>
                                <td className="py-2.5 px-3 text-ink font-mono text-[11.5px]">
                                    #{link.entityId || 'عام'}
                                </td>
                                <td className="py-2.5 px-3 text-inkMuted">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        {link.viewCount || 0}
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-inkMuted">
                                    <span className={`flex items-center gap-1 ${isExpired ? 'text-destructive font-semibold' : ''}`}>
                                        <Clock className="h-3 w-3" />
                                        {new Date(link.expiresAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </td>
                                <td className="py-2.5 px-3 text-left">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCopy(link.id, link.shareUrl)}
                                            className="h-7 px-2 text-[11px] gap-1"
                                            title="نسخ الرابط"
                                        >
                                            {copiedId === link.id ? <Check className="h-3 w-3 text-ok" /> : <Copy className="h-3 w-3" />}
                                            <span>{copiedId === link.id ? 'تم' : 'نسخ'}</span>
                                        </Button>
                                        {onRevoke && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onRevoke(link.id || link.token)}
                                                className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 gap-1"
                                                title="إلغاء الصلاحية فوراً"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                <span>إلغاء</span>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default ShareLinksTable;
