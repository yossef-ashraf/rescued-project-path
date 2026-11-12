'use client';
import { Suspense } from 'react';
import { SystemLogsView } from '@/features/settings/index.js';

export default function LogsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل السجلات...</div>}>
            <SystemLogsView />
        </Suspense>
    );
}
