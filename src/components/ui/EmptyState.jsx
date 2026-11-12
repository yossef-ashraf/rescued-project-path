'use client';

import React from 'react';
import { cn } from '@/shared/utils/utils.js';
import { Button } from './button';

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    action,
    className,
    compact = false
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-line bg-surface/40',
                compact ? 'p-6' : 'py-12 px-6',
                className
            )}
        >
            {Icon && (
                <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-surfaceMuted text-inkMuted border border-line">
                    <Icon className="h-6 w-6" />
                </div>
            )}
            <h4 className="text-[14.5px] font-semibold text-ink mb-1">{title}</h4>
            {description && (
                <p className="text-[12.5px] text-inkMuted max-w-sm mb-4 leading-relaxed">
                    {description}
                </p>
            )}
            {action ? (
                action
            ) : actionLabel && onAction ? (
                <Button size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
}

export default EmptyState;
