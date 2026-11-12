'use client';

import React, { use, Suspense } from 'react';
import CourseBookPdfView from '@/features/learning/components/CourseBookPdfView.jsx';

function BookLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center p-12 text-center text-xs font-mono text-zinc-400 animate-pulse">
            Loading Course Book Edition...
        </div>
    );
}

export default function CourseBookPage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams?.id;

    return (
        <Suspense fallback={<BookLoadingFallback />}>
            <CourseBookPdfView courseId={id} />
        </Suspense>
    );
}
