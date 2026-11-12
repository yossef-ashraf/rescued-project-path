'use client';
import { Suspense } from 'react';
import { CourseAddForm } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.jsx';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-8 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading...", "جاري التحميل...")}
        </div>
    );
}

export default function AddCoursePage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CourseAddForm />
        </Suspense>
    );
}
