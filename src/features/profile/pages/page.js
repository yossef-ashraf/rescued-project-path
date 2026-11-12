'use client';

import { Suspense } from 'react';
import { ProfileView } from '@/features/profile';

export default function ProfilePage({ initialSection }) {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">جاري تحميل الملف الشخصي...</div>}>
            <ProfileView initialSection={initialSection} />
        </Suspense>
    );
}
