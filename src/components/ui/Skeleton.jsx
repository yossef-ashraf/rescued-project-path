'use client';

import React from 'react';
import { cn } from '@/shared/utils/utils.js';

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn('animate-pulse rounded-xl bg-zinc-200/70 dark:bg-white/[0.06]', className)}
            {...props}
        />
    );
}

export function CardSkeleton({ rows = 3, className }) {
    return (
        <div className={cn('rounded-xl border border-line bg-surface p-5 space-y-3 shadow-card', className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <div className="space-y-2 pt-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-3.5 w-full" />
                ))}
            </div>
        </div>
    );
}

export function PageDashboardSkeleton({ kpiCount = 4, className }) {
    return (
        <div className={cn('w-full space-y-6 py-2', className)} aria-busy="true" aria-label="Loading page content">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56 sm:w-72 rounded-xl" />
                    <Skeleton className="h-4 w-40 sm:w-64 rounded-lg" />
                </div>
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-11 w-28 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </div>

            {/* KPI Cards Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {Array.from({ length: kpiCount }).map((_, idx) => (
                    <div key={idx} className="rounded-xl border border-line bg-surface p-4 lg:p-5 space-y-3 shadow-card">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-7 w-28" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Main Content / Chart & Table Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-2 rounded-xl border border-line bg-surface p-5 space-y-4 shadow-card">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                    <Skeleton className="h-56 w-full rounded-xl" />
                </div>
                <div className="rounded-xl border border-line bg-surface p-5 space-y-3.5 shadow-card">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function FormSkeleton({ fields = 6, className }) {
    return (
        <div className={cn('w-full max-w-4xl mx-auto space-y-6 py-2', className)} aria-busy="true" aria-label="Loading form">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-52 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
                <Skeleton className="h-11 w-28 rounded-xl" />
            </div>
            <div className="rounded-xl border border-line bg-surface p-6 space-y-5 shadow-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: fields }).map((_, idx) => (
                        <div key={idx} className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-11 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export default Skeleton;
