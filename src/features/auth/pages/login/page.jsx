'use client';

import { Suspense } from 'react';
import LoginView from '@/features/auth/components/LoginView';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">جاري التحميل...</div>}>
            <LoginView />
        </Suspense>
    );
}
