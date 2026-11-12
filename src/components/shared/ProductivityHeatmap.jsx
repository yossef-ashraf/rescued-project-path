'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/shared/context/AppContext.jsx';
import ContributionSkyline from './ContributionSkyline';
import ActivityHeatmap from '@/components/shared/ActivityHeatmap';
import { LayoutGrid, Box } from 'lucide-react';

export default function ProductivityHeatmap({ todos = [], courses = [], title }) {
    const { t } = useApp();

    const data = useMemo(() => {
        const countsByDate = {};

        (todos || []).forEach(todo => {
            if (todo.done === 1 || todo.done === true || todo.completed || todo.status === 'done' || todo.status === 'completed') {
                const dateStr = todo.updated_at 
                    ? String(todo.updated_at).split('T')[0] 
                    : (todo.created_at ? String(todo.created_at).split('T')[0] : null);
                if (dateStr) {
                    countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
                }
            }
        });

        (courses || []).forEach(course => {
            const dateStr = course.updated_at 
                ? String(course.updated_at).split('T')[0] 
                : (course.created_at ? String(course.created_at).split('T')[0] : null);
            if (dateStr && Number(course.completed_units) > 0) {
                countsByDate[dateStr] = (countsByDate[dateStr] || 0) + (Number(course.completed_units) * 4);
            }
        });

        return Object.entries(countsByDate).map(([date, count]) => ({
            date,
            count
        }));
    }, [todos, courses]);

    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return 'grid';
        }
        return 'skyline';
    });
    const [selectedHeatmapIndex, setSelectedHeatmapIndex] = useState(null);

    const displayTitle = title ?? (
        <span className="flex items-center gap-2">
            <span>🔥</span>
            <span>{t("Personal Learning & Activity Heatmap", "الخريطة الحرارية لنشاط التعلم والإنجاز")}</span>
        </span>
    );

    return (
        <div id="productivity-heatmap" data-component="productivity-heatmap" className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    {displayTitle}
                </div>
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <button
                        type="button"
                        onClick={() => setViewMode('skyline')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            viewMode === 'skyline'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                        title={t('3D Skyline view', 'عرض ثلاثي الأبعاد')}
                    >
                        <Box className="w-3.5 h-3.5" />
                        <span>3D</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            viewMode === 'grid'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                        title={t('Accessible 2D Heatmap Grid', 'شبكة حرارية ثنائية الأبعاد')}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Grid</span>
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <ActivityHeatmap
                    points={data}
                    selectedIndex={selectedHeatmapIndex}
                    onSelect={(idx) => setSelectedHeatmapIndex(idx)}
                />
            ) : (
                <ContributionSkyline
                    data={data}
                    title={null}
                    unit={t("point", "نقطة")}
                    unitPlural={t("points", "نقطة")}
                    palette="github"
                    defaultView="3d"
                    orbit={true}
                    showStats={true}
                    showLegend={true}
                    showToggle={false}
                    className="shadow-2xs"
                />
            )}
        </div>
    );
}
