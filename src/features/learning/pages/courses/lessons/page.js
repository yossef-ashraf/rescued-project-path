'use client';

import React, { Suspense } from 'react';
import AllLecturesView from '@/features/learning/components/AllLecturesView.jsx';

function AllLecturesLoading() {
    return (
        <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#BC5C29] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Loading curriculum index...</p>
        </div>
    );
}

export default function CoursesLessonsPage() {
    return (
        <Suspense fallback={<AllLecturesLoading />}>
            <AllLecturesView />
        </Suspense>
    );
}
