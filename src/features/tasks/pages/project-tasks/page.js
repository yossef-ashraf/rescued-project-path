'use client';
import { Suspense } from 'react';
import { ProjectTasksView } from '@/features/tasks';

export default function ProjectTasksPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل مهام المشروع...</div>}>
            <ProjectTasksView />
        </Suspense>
    );
}
