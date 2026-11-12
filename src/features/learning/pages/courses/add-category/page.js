'use client';
import { Suspense } from 'react';
import { CategoryAddForm } from '@/features/learning';
import { useApp } from '@/shared/context/AppContext.js';

function LoadingFallback() {
    const { t } = useApp();
    return (
        <div className="p-8 text-center text-xs font-mono text-inkMuted animate-pulse">
            {t("Loading...", "جاري التحميل...")}
        </div>
    );
}

export default function AddCategoryPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CategoryAddForm />
        </Suspense>
    );
}
