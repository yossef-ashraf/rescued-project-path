'use client';

import React, { useMemo } from 'react';
import { calculateHeatmapIntensity, normalizeActivityPoints } from './activity-heatmap.utils.js';

const INTENSITY_CLASSES = {
    0: 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500',
    1: 'bg-emerald-950/70 border-emerald-800/40 text-emerald-400',
    2: 'bg-emerald-800/80 border-emerald-700/50 text-emerald-300',
    3: 'bg-emerald-600/90 border-emerald-500/60 text-emerald-100',
    4: 'bg-emerald-400 border-emerald-300 text-zinc-950 font-bold'
};

export default function ActivityHeatmap({
    points = [],
    selectedIndex = null,
    onSelect = null,
    maxDailyValue = null,
    isLoading = false,
    emptyMessage = 'No activity recorded for this period.'
}) {
    const normalizedPoints = useMemo(() => normalizeActivityPoints(points), [points]);

    const calculatedMax = useMemo(() => {
        if (maxDailyValue && maxDailyValue > 0) return maxDailyValue;
        const maxFound = Math.max(0, ...normalizedPoints.map((p) => p.value));
        return maxFound > 0 ? maxFound : 10;
    }, [normalizedPoints, maxDailyValue]);

    if (isLoading) {
        return (
            <div className="activity-heatmap-skeleton flex items-center justify-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse text-xs text-zinc-400">
                Loading activity data...
            </div>
        );
    }

    if (normalizedPoints.length === 0) {
        return (
            <div className="activity-heatmap-empty flex items-center justify-center p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-xs text-zinc-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            className="activity-heatmap w-full overflow-x-auto p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60"
            role="region"
            aria-label="Activity Heatmap Grid"
        >
            <div className="flex flex-wrap gap-1.5 min-w-[280px]">
                {normalizedPoints.map((point, index) => {
                    const intensity = calculateHeatmapIntensity(point.value, calculatedMax);
                    const isSelected = selectedIndex === index;
                    const intensityClass = INTENSITY_CLASSES[intensity] || INTENSITY_CLASSES[0];

                    return (
                        <button
                            key={point.date || index}
                            type="button"
                            onClick={() => onSelect && onSelect(index, point)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onSelect && onSelect(index, point);
                                }
                            }}
                            className={`w-6 h-6 rounded-md border text-[10px] flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 ${intensityClass} ${
                                isSelected ? 'ring-2 ring-emerald-400 scale-110 z-10 shadow-md' : 'hover:scale-105'
                            }`}
                            aria-label={`${point.date}: ${point.value} units`}
                            title={`${point.date}: ${point.value} units`}
                        >
                            <span className="sr-only">{point.value}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export { calculateHeatmapIntensity, normalizeActivityPoints };
