'use client';

import { Suspense } from 'react';
import { LeadsManagementView } from '@/features/operations';

export default function LeadsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <LeadsManagementView />
        </Suspense>
    );
}
