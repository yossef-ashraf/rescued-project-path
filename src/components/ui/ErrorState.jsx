'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { Button } from './button';

export function ErrorState({
    title = 'حدث خطأ أثناء تحميل البيانات',
    message,
    onRetry,
    retryLabel = 'إعادة المحاولة',
    className
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center rounded-lg border border-crit/25 bg-crit/5 p-6 my-4',
                className
            )}
        >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-crit/15 text-crit">
                <AlertCircle className="h-5 w-5" />
            </div>
            <h4 className="text-[14px] font-semibold text-ink mb-1">{title}</h4>
            {message && (
                <p className="text-[12px] text-crit/90 max-w-md mb-4 font-mono leading-relaxed">
                    {message}
                </p>
            )}
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="border-crit/30 hover:bg-crit/10 text-ink"
                >
                    <RefreshCw className="h-3.5 w-3.5 me-1.5" />
                    {retryLabel}
                </Button>
            )}
        </div>
    );
}

export default ErrorState;
