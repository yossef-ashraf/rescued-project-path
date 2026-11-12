'use client';
import { Suspense } from 'react';
import { SettingsDashboardView } from '@/features/settings';

export default function SettingsPage(props) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل الإعدادات...</div>}>
            <SettingsDashboardView {...props} />
        </Suspense>
    );
}
