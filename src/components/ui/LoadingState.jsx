'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
  ...props
}) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size] || 'h-6 w-6';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center text-muted gap-3',
        className
      )}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', iconSizes)} />
      {message && <p className="text-[13px] font-medium">{message}</p>}
    </div>
  );
}

export default LoadingState;
