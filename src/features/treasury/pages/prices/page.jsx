'use client';

import { Suspense } from 'react';
import { PriceIndexView } from '@/features/treasury';

export default function PricesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <PriceIndexView />
        </Suspense>
    );
}
