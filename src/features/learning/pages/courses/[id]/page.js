'use client';

import React, { use, Suspense } from 'react';
import { CourseDetailsView } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.js';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-12 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading course workspace...", "جاري تحميل تفاصيل ومساحة عمل الكورس...")}
        </div>
    );
}

export default function CourseDetailPage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams?.id;

    return (
        <Suspense fallback={<LoadingFallback />}>
            <CourseDetailsView courseId={id} />
        </Suspense>
    );
}
