'use client';

import { Suspense } from 'react';
import ProfilePage from '../page';

export default function ProfileBasicPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#6E5A4E]">Loading basic...</div>}>
            <ProfilePage initialSection="basic" />
        </Suspense>
    );
}
