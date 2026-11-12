'use client';

import React from 'react';
import GlobalActionIndicator from '@/components/layout/GlobalActionIndicator';
import GlobalDriveSyncIndicator from '@/components/layout/GlobalDriveSyncIndicator';
import MatteAlertHost from '@/components/ui/MatteAlert';
import CommandPalette from '@/components/layout/CommandPalette';

export function GlobalOverlays() {
    return (
        <>
            <GlobalActionIndicator />
            <GlobalDriveSyncIndicator />
            <MatteAlertHost />
            <CommandPalette />
        </>
    );
}

export default GlobalOverlays;
