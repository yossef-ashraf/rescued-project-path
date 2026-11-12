'use client';

import { Suspense } from 'react';
import { ProjectsListView } from '@/features/operations';

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>}>
            <ProjectsListView />
        </Suspense>
    );
}
