'use client';

import * as React from 'react';
import { cn } from '@/shared/utils/utils.js';

export function Tooltip({ content, position = 'top', children, className }) {
  const [visible, setVisible] = React.useState(false);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 me-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ms-1.5',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';

  if (!content) return children;

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-white shadow-md pointer-events-none transition-opacity dark:bg-zinc-100 dark:text-zinc-900',
            posClasses
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
