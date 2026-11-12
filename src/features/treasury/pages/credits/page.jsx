'use client';

import { Suspense } from 'react';
import { CreditsTrackerView } from '@/features/treasury';

export default function CreditsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <CreditsTrackerView />
        </Suspense>
    );
}
