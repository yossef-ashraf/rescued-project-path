'use client';

import React from 'react';
import { cn } from '@/shared/utils/utils.js';

export function PageContainer({
    children,
    className,
    maxWidth = 'max-w-[1780px]',
    noPadding = false
}) {
    return (
        <div
            className={cn(
                'w-full mx-auto min-w-0 transition-all duration-200',
                maxWidth,
                noPadding ? 'p-0' : 'px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8',
                className
            )}
        >
            {children}
        </div>
    );
}

export default PageContainer;
