'use client';

import React from 'react';
import dynamic from '@/shared/next-compat/dynamic';

const PublicShareView = dynamic(() => import('@/features/sharing/components/PublicShareView.jsx'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f11] text-zinc-400">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-mono animate-pulse">Loading shared content...</p>
            </div>
        </div>
    )
});

export default function PublicSharePage(props) {
    return <PublicShareView {...props} />;
}
