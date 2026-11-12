'use client';
import { Suspense } from 'react';
import { CourseHierarchyView } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.js';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-8 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading course hierarchy...", "جاري تحميل شجرة الكورسات...")}
        </div>
    );
}

export default function CoursesHierarchyPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CourseHierarchyView />
        </Suspense>
    );
}
