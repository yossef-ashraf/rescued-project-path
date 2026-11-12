'use client';
import { Suspense } from 'react';
import { TasksTodoView } from '@/features/tasks';

export default function TasksTodoPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل قائمة المهام...</div>}>
            <TasksTodoView />
        </Suspense>
    );
}
