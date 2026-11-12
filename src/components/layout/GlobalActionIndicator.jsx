'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

export default function GlobalActionIndicator() {
    const { t } = useApp();
    const [activity, setActivity] = useState({ busy: false, activeCount: 0 });

    useEffect(() => {
        const handleActivity = (event) => {
            if (event?.detail) {
                setActivity({
                    busy: Boolean(event.detail.busy),
                    activeCount: event.detail.activeCount || 0
                });
            }
        };
        window.addEventListener('codex:api-activity', handleActivity);
        return () => window.removeEventListener('codex:api-activity', handleActivity);
    }, []);

    if (!activity.busy) return null;

    return (
        <>
            <div className="fixed top-0 inset-x-0 z-[110] md-progress-track pointer-events-none" />
            <div
                role="status"
                aria-live="polite"
                className="fixed top-3 inset-x-0 mx-auto w-fit z-[110] inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/95 px-3.5 py-1.5 text-[12px] font-semibold text-ink shadow-pop backdrop-blur-md pointer-events-none"
            >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>{t('Executing action...', 'جاري تنفيذ العملية...')}</span>
            </div>
        </>
    );
}
