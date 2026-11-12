'use client';

import { Suspense } from 'react';
import ProfilePage from '../page';

export default function ProfileAboutPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#6E5A4E]">Loading about...</div>}>
            <ProfilePage initialSection="about" />
        </Suspense>
    );
}
