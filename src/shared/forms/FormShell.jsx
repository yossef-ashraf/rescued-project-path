'use client';

import React from 'react';
import { cn } from '@/shared/utils/utils.js';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function FormShell({
    title,
    description,
    children,
    onSubmit,
    onCancel,
    isSubmitting = false,
    isDirty = false,
    error = null,
    submitLabel = 'حفظ التغييرات',
    cancelLabel = 'إلغاء',
    className
}) {
    return (
        <form
            onSubmit={onSubmit}
            className={cn('rounded-xl border border-line bg-surface flex flex-col', className)}
        >
            {/* Header */}
            {(title || description) && (
                <div className="border-b border-line px-5 py-4 shrink-0">
                    {title && <h3 className="text-[15px] font-semibold text-ink">{title}</h3>}
                    {description && (
                        <p className="mt-0.5 text-[12px] text-inkMuted leading-normal">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* General form error alert */}
            {error && (
                <div className="mx-5 mt-4 p-3 rounded-lg border border-crit/30 bg-crit/10 text-crit text-[12px] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Form Fields Body */}
            <div className="p-5 space-y-4 flex-1">{children}</div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3.5 bg-surfaceMuted/40 shrink-0">
                <div className="text-[11.5px] text-inkMuted">
                    {isDirty ? (
                        <span className="text-warn font-medium">• لديك تعديلات غير محفوظة</span>
                    ) : null}
                </div>

                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={onCancel}
                        >
                            {cancelLabel}
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isSubmitting}
                    >
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default FormShell;
