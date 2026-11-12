'use client';

import React, { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

/**
 * DataView
 * Unified Responsive Data View: Renders an accessible Table with sticky header on desktop (md+)
 * and responsive collapsible Cards on mobile (<md).
 */
export function DataView({
    columns = [], // [{ key, label, render?, className? }]
    data = [],
    isLoading = false,
    emptyTitle = 'لا توجد عناصر',
    emptyDescription = 'لم يتم العثور على أي بيانات حالياً.',
    searchPlaceholder = 'بحث...',
    searchable = true,
    renderMobileCard, // optional custom card renderer: (item) => ReactNode
    onRowClick,
    pagination = false,
    pageSize = 10,
    className
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedMobileRows, setExpandedMobileRows] = useState({});

    const toggleMobileExpand = (rowId, e) => {
        e.stopPropagation();
        setExpandedMobileRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };

    const filteredData = React.useMemo(() => {
        if (!searchTerm.trim()) return data;
        const term = searchTerm.toLowerCase();
        return data.filter((item) => {
            return columns.some((col) => {
                const val = item[col.key];
                return val != null && String(val).toLowerCase().includes(term);
            });
        });
    }, [data, searchTerm, columns]);

    const totalPages = pagination ? Math.ceil(filteredData.length / pageSize) || 1 : 1;
    const paginatedData = React.useMemo(() => {
        if (!pagination) return filteredData;
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, pagination, currentPage, pageSize]);

    return (
        <div className={cn('w-full space-y-4', className)}>
            {/* Search toolbar */}
            {searchable && (
                <div className="relative max-w-sm">
                    <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-inkMuted pointer-events-none" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder={searchPlaceholder}
                        className="w-full min-h-[48px] sm:min-h-[44px] ps-10 pe-4 py-2 text-[13.5px] bg-surface rounded-xl border border-line text-ink placeholder:text-inkMuted focus:outline-none focus:border-primary/50"
                    />
                </div>
            )}

            {/* Content states */}
            {isLoading ? (
                <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            ) : filteredData.length === 0 ? (
                <EmptyState title={emptyTitle} description={emptyDescription} compact />
            ) : (
                <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-hidden rounded-xl border border-line bg-surface shadow-card">
                        <div className="overflow-x-auto max-h-[640px]">
                            <table className="w-full min-w-[640px] text-start text-[13px] border-collapse">
                                <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xs border-b border-line">
                                    <tr className="text-inkMuted text-[11.5px] font-bold uppercase tracking-wider">
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                className={cn('px-4 py-3 text-start font-bold whitespace-nowrap', col.className)}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {paginatedData.map((item, idx) => (
                                        <tr
                                            key={item.id || idx}
                                            tabIndex={onRowClick ? 0 : undefined}
                                            onClick={() => onRowClick?.(item)}
                                            onKeyDown={(e) => {
                                                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    onRowClick(item);
                                                }
                                            }}
                                            className={cn(
                                                'transition-colors hover:bg-line2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
                                                onRowClick && 'cursor-pointer'
                                            )}
                                        >
                                            {columns.map((col) => (
                                                <td key={col.key} className={cn('px-4 py-3 text-ink', col.className)}>
                                                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View: Cards (< 768px) */}
                    <div className="block md:hidden space-y-3">
                        {paginatedData.map((item, idx) => {
                            const rowKey = item.id || idx;
                            if (renderMobileCard) {
                                return (
                                    <div key={rowKey} onClick={() => onRowClick?.(item)}>
                                        {renderMobileCard(item)}
                                    </div>
                                );
                            }

                            const primaryCols = columns.slice(0, 3);
                            const extraCols = columns.slice(3);
                            const isExpanded = Boolean(expandedMobileRows[rowKey]);

                            return (
                                <div
                                    key={rowKey}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        'rounded-xl border border-line bg-surface p-4 space-y-2.5 shadow-card transition-colors',
                                        onRowClick && 'active:bg-line2/40 cursor-pointer'
                                    )}
                                >
                                    {primaryCols.map((col, cIdx) => (
                                        <div
                                            key={col.key}
                                            className={cn(
                                                'flex items-center justify-between gap-2 text-[13px]',
                                                cIdx === 0 && 'font-bold text-ink text-[14px] border-b border-line pb-2'
                                            )}
                                        >
                                            {cIdx > 0 && <span className="text-inkMuted shrink-0">{col.label}:</span>}
                                            <span className={cn('truncate', cIdx === 0 ? 'text-ink' : 'text-inkSecondary')}>
                                                {col.render ? col.render(item[col.key], item) : item[col.key]}
                                            </span>
                                        </div>
                                    ))}

                                    {extraCols.length > 0 && (
                                        <>
                                            {isExpanded && (
                                                <div className="pt-2 border-t border-line/60 space-y-2">
                                                    {extraCols.map((col) => (
                                                        <div key={col.key} className="flex items-center justify-between gap-2 text-[12.5px]">
                                                            <span className="text-inkMuted shrink-0">{col.label}:</span>
                                                            <span className="text-inkSecondary truncate">
                                                                {col.render ? col.render(item[col.key], item) : item[col.key]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => toggleMobileExpand(rowKey, e)}
                                                className="w-full pt-1.5 flex items-center justify-center gap-1 text-[11.5px] font-semibold text-primary hover:underline cursor-pointer"
                                            >
                                                <span>{isExpanded ? 'إخفاء التفاصيل' : `عرض المزيد (${extraCols.length})`}</span>
                                                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination && totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 px-1 text-[12px] text-inkMuted">
                            <span>
                                صفحة {currentPage} من {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    aria-label="الصفحة السابقة"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line disabled:opacity-30 disabled:pointer-events-none hover:bg-line2"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    aria-label="الصفحة التالية"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line disabled:opacity-30 disabled:pointer-events-none hover:bg-line2"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default DataView;
