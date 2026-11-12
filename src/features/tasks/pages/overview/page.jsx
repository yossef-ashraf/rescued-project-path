'use client';
import { Suspense } from 'react';
import { TasksOverviewView } from '@/features/tasks';

export default function TasksOverviewPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل النظرة العامة...</div>}>
            <TasksOverviewView />
        </Suspense>
    );
}
