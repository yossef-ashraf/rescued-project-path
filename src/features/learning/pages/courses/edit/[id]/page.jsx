'use client';
import { Suspense } from 'react';
import { CourseEditForm } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.jsx';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-8 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading course editor...", "جاري تحميل تعديل الكورس...")}
        </div>
    );
}

export default function EditCoursePage(props) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CourseEditForm {...props} />
        </Suspense>
    );
}
