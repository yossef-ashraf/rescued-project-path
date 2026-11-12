'use client';

import * as React from 'react';
import { cn } from '@/shared/utils/utils.js';

const TabsContext = React.createContext({
  value: '',
  onValueChange: () => {},
});

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }) {
  const [tabValue, setTabValue] = React.useState(defaultValue || '');
  const isControlled = value !== undefined;
  const currentVal = isControlled ? value : tabValue;
  const handleChange = (val) => {
    if (!isControlled) setTabValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: currentVal, onValueChange: handleChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  return (
    <div className={cn('ds-tabs-list', className)} role="tablist" {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, disabled = false, className, children, ...props }) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'ds-tabs-trigger',
        isActive ? 'ds-tabs-trigger-active' : 'text-muted hover:text-ink',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children, ...props }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-3 ring-offset-background focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}
