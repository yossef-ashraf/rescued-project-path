'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
  ...props
}) {
  const pages = React.useMemo(() => {
    const list = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    return list;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('flex items-center justify-center gap-1.5 py-4', className)}
      {...props}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange?.(currentPage - 1)}
        className="btn-icon h-8 w-8 disabled:opacity-40"
        aria-label="Previous Page"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange?.(1)}
            className="h-8 min-w-8 rounded-md px-2 text-[12.5px] font-medium text-muted hover:bg-line2 hover:text-ink cursor-pointer"
          >
            1
          </button>
          {pages[0] > 2 && <span className="px-1 text-faint">…</span>}
        </>
      )}

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange?.(p)}
            className={cn(
              'h-8 min-w-8 rounded-md px-2 text-[12.5px] font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'text-muted hover:bg-line2 hover:text-ink'
            )}
          >
            {p}
          </button>
        );
      })}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-faint">…</span>}
          <button
            type="button"
            onClick={() => onPageChange?.(totalPages)}
            className="h-8 min-w-8 rounded-md px-2 text-[12.5px] font-medium text-muted hover:bg-line2 hover:text-ink cursor-pointer"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange?.(currentPage + 1)}
        className="btn-icon h-8 w-8 disabled:opacity-40"
        aria-label="Next Page"
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </button>
    </nav>
  );
}

export default Pagination;
