'use client';

import Scene from '@/components/shared/Scene';

export default function DockPreviewPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-start pt-12 px-4 relative overflow-hidden">
            <div className="w-full max-w-6xl mx-auto space-y-8">
                <Scene />
            </div>
        </div>
    );
}
