'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';

export function DesktopSidebar({ className }) {
    return <Sidebar isDesktopOnly={true} className={className} />;
}

export default DesktopSidebar;
