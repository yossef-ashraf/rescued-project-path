'use client';

import { Suspense } from 'react';
import { MonthlyBreakdownView } from '@/features/treasury';

export default function MonthsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <MonthlyBreakdownView />
        </Suspense>
    );
}
