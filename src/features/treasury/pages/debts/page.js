'use client';

import { Suspense } from 'react';
import { DebtsTrackerView } from '@/features/treasury';

export default function DebtsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <DebtsTrackerView />
        </Suspense>
    );
}
