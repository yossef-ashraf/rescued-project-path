'use client';

import React, { use, Suspense } from 'react';
import { MaterialDetailsView } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.jsx';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-12 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading material workspace...", "جاري تحميل تفاصيل ومساحة عمل المادة...")}
        </div>
    );
}

export default function MaterialDetailPage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams?.id;

    return (
        <Suspense fallback={<LoadingFallback />}>
            <MaterialDetailsView materialId={id} />
        </Suspense>
    );
}
