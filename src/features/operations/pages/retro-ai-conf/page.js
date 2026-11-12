'use client';
import { Suspense } from 'react';
import { RetroAiConfigView } from '@/features/settings';

export default function RetroAiConfPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل إعدادات الذكاء الاصطناعي...</div>}>
            <RetroAiConfigView />
        </Suspense>
    );
}
