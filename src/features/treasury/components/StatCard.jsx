'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    sublabel,
    value,
    valueCurrency,
    valueColor,
    sparklineData,
    sparklineColor,
    gradientId,
    trendLabel
}) {
    const trendInfo = useMemo(() => {
        if (trendLabel) return { text: trendLabel, dir: 'neutral' };
        if (!Array.isArray(sparklineData) || sparklineData.length < 2) return null;
        const first = Number(sparklineData[0]?.v || 0);
        const last = Number(sparklineData[sparklineData.length - 1]?.v || 0);
        if (first === 0 && last === 0) return null;
        if (first === 0) return { text: last > 0 ? '+100%' : '0%', dir: last > 0 ? 'up' : 'neutral' };
        const diffPct = Math.round(((last - first) / Math.abs(first)) * 100);
        if (diffPct === 0) return { text: '0%', dir: 'neutral' };
        return {
            text: `${diffPct > 0 ? '+' : ''}${diffPct}%`,
            dir: diffPct > 0 ? 'up' : 'down'
        };
    }, [sparklineData, trendLabel]);

    return (
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-xl border border-[#E5E7EB] dark:border-zinc-800/80 bg-white dark:bg-zinc-900/85 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-pop)] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between gap-3.5 group">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate" title={label}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    {trendInfo && (
                        <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                                trendInfo.dir === 'up'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : trendInfo.dir === 'down'
                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                            }`}
                        >
                            {trendInfo.dir === 'up' ? (
                                <TrendingUp className="w-2.5 h-2.5" />
                            ) : trendInfo.dir === 'down' ? (
                                <TrendingDown className="w-2.5 h-2.5" />
                            ) : (
                                <Minus className="w-2.5 h-2.5" />
                            )}
                            <span>{trendInfo.text}</span>
                        </span>
                    )}
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity rtl:-scale-x-100" />
                </div>
            </div>
            <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1 truncate" title={sublabel}>
                    {sublabel}
                </span>
                <div className="flex items-end justify-between gap-2">
                    <h2 className={`text-xl sm:text-2xl font-black tracking-tight font-mono tabular-nums whitespace-nowrap ${valueColor}`}>
                        {value} <span className={`text-[10px] sm:text-xs font-bold font-sans ${valueColor}`}>{valueCurrency}</span>
                    </h2>
                    {sparklineData && sparklineData.length > 0 && (
                        <div className="w-20 sm:w-24 h-9 sm:h-10 shrink-0 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={sparklineColor} stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="v"
                                        stroke={sparklineColor}
                                        strokeWidth={2}
                                        fill={`url(#${gradientId})`}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
