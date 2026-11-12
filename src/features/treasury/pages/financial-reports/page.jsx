'use client';
import { Suspense } from 'react';
import { FinancialReportsView } from '@/features/reports';

export default function FinancialReportsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل التقارير المالية...</div>}>
            <FinancialReportsView />
        </Suspense>
    );
}
