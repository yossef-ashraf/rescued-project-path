'use client';
import { Suspense } from 'react';
import { TasksDashboardView } from '@/features/tasks';

export default function TasksPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل المهام...</div>}>
            <TasksDashboardView />
        </Suspense>
    );
}
