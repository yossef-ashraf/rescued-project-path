'use client';
import { Suspense } from 'react';
import { CourseOverviewView } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.js';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-8 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading courses overview...", "جاري تحميل نظرة عامة للكورسات...")}
        </div>
    );
}

export default function CoursesOverviewPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CourseOverviewView />
        </Suspense>
    );
}
