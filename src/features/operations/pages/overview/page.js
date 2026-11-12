'use client';
import { Suspense } from 'react';
import OverviewDashboardView from '@/components/shared/OverviewDashboardView';

export default function OverviewPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل لوحة التحكم...</div>}>
            <OverviewDashboardView />
        </Suspense>
    );
}
