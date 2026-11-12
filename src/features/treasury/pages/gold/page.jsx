'use client';

import { Suspense } from 'react';
import { GoldCalculatorView } from '@/features/treasury';

export default function GoldPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <GoldCalculatorView />
        </Suspense>
    );
}
