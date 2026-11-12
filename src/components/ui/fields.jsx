'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '@/shared/utils/utils.js';

export const fieldWidth = {
    xs: 'max-w-[84px]',
    sm: 'max-w-[140px]',
    mini: 'max-w-[190px]',
    md: 'max-w-[300px]',
    lg: 'max-w-[440px]',
    xl: 'max-w-[620px]',
    full: 'w-full',
};

export function inferFieldWidth({ key = '', type = '' } = {}) {
    const k = String(key).toLowerCase();
    if (type === 'number') return 'sm';
    if (type === 'date' || type === 'datetime-local') return 'mini';
    if (/^(code|sku|zip|postal|currency|iso|prefix|ext|sort|order|rank|qty|quantity|rate|percent|tax|age|day|month|year)$/.test(k)) return 'xs';
    if (/(_id|id|price|amount|total|cost|fee|discount|weight|width|height|length|stock|limit|min|max|count|points)$/.test(k)) return 'sm';
    if (/(phone|mobile|tel|whatsapp|date|_at|time|status|type|role|gender|lang|locale|country|city)$/.test(k)) return 'mini';
    if (/(description|notes|body|content|bio|summary|message|comment|address_line|street|url|link|webhook|endpoint)$/.test(k)) return 'xl';
    if (/(title|subject|headline|address|location|company)$/.test(k)) return 'lg';
    return 'md';
}

export const stateBorder = {
    default: 'border-[#E5E7EB] dark:border-zinc-800 focus:border-primary focus:ring-2 focus:ring-primary/25',
    error: 'border-crit focus:border-crit focus:ring-2 focus:ring-crit/25',
    warning: 'border-warn focus:border-warn focus:ring-2 focus:ring-warn/25',
    success: 'border-ok focus:border-ok focus:ring-2 focus:ring-ok/25',
};

export function FieldShell({ label, hint, error, warning, success, required, width = 'full', className, children }) {
    const generatedId = useId();
    const state = error ? 'error' : warning ? 'warning' : success ? 'success' : 'default';
    const msg = error || warning || success || hint;
    const msgId = msg ? `${generatedId}-msg` : undefined;
    const msgColor =
        state === 'error'
            ? 'text-crit font-medium'
            : state === 'warning'
                ? 'text-warn font-medium'
                : state === 'success'
                    ? 'text-ok font-medium'
                    : 'text-muted';

    const a11yProps = {
        id: generatedId,
        'aria-invalid': Boolean(error),
        'aria-describedby': msgId,
    };

    return (
        <div className={cn('w-full', fieldWidth[width] || fieldWidth.full, className)}>
            {label && (
                <label htmlFor={generatedId} className="mb-1.5 flex items-center justify-between gap-2 text-[13px] font-semibold text-ink2">
                    <span>
                        {label}
                        {required && <span className="ms-0.5 text-crit" aria-hidden="true">*</span>}
                    </span>
                    {required && (
                        <span className="text-[10.5px] font-semibold text-crit/90 bg-crit/10 px-1.5 py-0.5 rounded-md">
                            مطلوب
                        </span>
                    )}
                </label>
            )}
            {typeof children === 'function' ? children(stateBorder[state], a11yProps) : children}
            {msg && (
                <p id={msgId} role={error ? 'alert' : undefined} className={cn('mt-1 text-[12px]', msgColor)}>
                    {msg}
                </p>
            )}
        </div>
    );
}

export const Field = FieldShell;

export function Txt({ label, hint, error, warning, success, required, width = 'md', className, inputClassName, title, value, ...props }) {
    const resolvedTitle = title ?? (typeof value === 'string' && value.length > 24 ? value : undefined);
    return (
        <FieldShell
            label={label}
            hint={hint}
            error={error}
            warning={warning}
            success={success}
            required={required}
            width={width}
            className={className}
        >
            {(borderCls, a11yProps) => (
                <input
                    {...a11yProps}
                    value={value}
                    title={resolvedTitle}
                    className={cn(
                        'min-h-[48px] sm:min-h-[44px] w-full rounded-[12px] border bg-surface px-4 text-[13.5px] text-ink placeholder:text-faint focus:outline-none disabled:cursor-not-allowed disabled:bg-line2 disabled:text-muted transition-colors',
                        borderCls,
                        inputClassName
                    )}
                    {...props}
                />
            )}
        </FieldShell>
    );
}

export function Money({ label, currency = 'USD', hint, error, required, width = 'sm', className, ...props }) {
    return (
        <FieldShell label={label} hint={hint} error={error} required={required} width={width} className={className}>
            {(borderCls, a11yProps) => (
                <div className={cn('flex min-h-[48px] sm:min-h-[44px] w-full items-center overflow-hidden rounded-[12px] border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25', borderCls)}>
                    <span className="select-none border-e border-line bg-line2 px-3 text-[12px] font-medium text-muted h-full flex items-center">
                        {currency}
                    </span>
                    <input
                        {...a11yProps}
                        type="number"
                        step="0.01"
                        className="h-full w-full bg-transparent px-3 text-[13.5px] tabular-nums text-ink focus:outline-none"
                        {...props}
                    />
                </div>
            )}
        </FieldShell>
    );
}

export function Phone({ label, dialCode = '+20', hint, error, required, width = 'mini', className, ...props }) {
    return (
        <FieldShell label={label} hint={hint} error={error} required={required} width={width} className={className}>
            {(borderCls, a11yProps) => (
                <div className={cn('flex min-h-[48px] sm:min-h-[44px] w-full items-center overflow-hidden rounded-[12px] border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25', borderCls)}>
                    <span className="select-none border-e border-line bg-line2 px-3 text-[12px] font-medium tabular-nums text-muted h-full flex items-center">
                        {dialCode}
                    </span>
                    <input
                        {...a11yProps}
                        type="tel"
                        className="h-full w-full bg-transparent px-3 text-[13.5px] tabular-nums text-ink focus:outline-none"
                        {...props}
                    />
                </div>
            )}
        </FieldShell>
    );
}

export function Area({ label, hint, error, required, width = 'xl', rows = 3, className, ...props }) {
    return (
        <FieldShell label={label} hint={hint} error={error} required={required} width={width} className={className}>
            {(borderCls, a11yProps) => (
                <textarea
                    {...a11yProps}
                    rows={rows}
                    className={cn(
                        'w-full rounded-[12px] border bg-surface px-4 py-2.5 text-[13.5px] text-ink placeholder:text-faint focus:outline-none disabled:cursor-not-allowed disabled:bg-line2 disabled:text-muted transition-colors',
                        borderCls
                    )}
                    {...props}
                />
            )}
        </FieldShell>
    );
}

export function Sel({ label, hint, error, required, width = 'mini', options = [], children, className, title, value, ...props }) {
    const selectedLabel = React.useMemo(() => {
        if (title) return title;
        const found = options.find((opt) => (typeof opt === 'object' ? String(opt.value) === String(value) : String(opt) === String(value)));
        if (found) return typeof found === 'object' ? found.label : String(found);
        return typeof value === 'string' ? value : undefined;
    }, [title, options, value]);

    return (
        <FieldShell label={label} hint={hint} error={error} required={required} width={width} className={className}>
            {(borderCls, a11yProps) => (
                <select
                    {...a11yProps}
                    value={value}
                    title={selectedLabel}
                    className={cn(
                        'min-h-[48px] sm:min-h-[44px] w-full rounded-[12px] border bg-surface px-3.5 text-[13.5px] text-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-line2 disabled:text-muted transition-colors truncate',
                        borderCls
                    )}
                    {...props}
                >
                    {children ||
                        options.map((opt) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const lbl = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <option key={val} value={val}>
                                    {lbl}
                                </option>
                            );
                        })}
                </select>
            )}
        </FieldShell>
    );
}

export function Toggle({ checked, onChange, label, description, disabled = false, className }) {
    return (
        <label className={cn('flex items-start justify-between gap-4 select-none min-h-[44px] items-center', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', className)}>
            {(label || description) && (
                <div className="min-w-0">
                    {label && <div className="text-[13px] font-medium text-ink">{label}</div>}
                    {description && <div className="text-[12px] text-muted">{description}</div>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={Boolean(checked)}
                disabled={disabled}
                onClick={() => !disabled && onChange?.(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/25',
                    checked ? 'bg-primary' : 'bg-line'
                )}
            >
                <span
                    className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform',
                        checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-1 rtl:-translate-x-1'
                    )}
                />
            </button>
        </label>
    );
}

export function Segmented({ value, onChange, options = [], className }) {
    return (
        <div className={cn('inline-flex rounded-xl border border-line bg-line2 p-1', className)}>
            {options.map((opt) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const lbl = typeof opt === 'object' ? opt.label : opt;
                const active = value === val;
                return (
                    <button
                        key={val}
                        type="button"
                        onClick={() => onChange?.(val)}
                        aria-pressed={active}
                        className={cn(
                            'rounded-lg px-3 py-1.5 min-h-[36px] text-[12px] font-medium transition-colors cursor-pointer',
                            active ? 'bg-surface text-ink shadow-card font-semibold' : 'text-muted hover:text-ink'
                        )}
                    >
                        {lbl}
                    </button>
                );
            })}
        </div>
    );
}

export function Section({ title, description, actions, children, className }) {
    return (
        <section className={cn('rounded-xl border border-line bg-surface shadow-card', className)}>
            {(title || description || actions) && (
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                    <div>
                        {title && <h3 className="text-[14px] font-semibold text-ink">{title}</h3>}
                        {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className="p-6">{children}</div>
        </section>
    );
}

export const Label = React.forwardRef(({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn('form-label flex items-center gap-1', className)} {...props}>
        {children}
        {required && <span className="text-crit" aria-hidden="true">*</span>}
    </label>
));
Label.displayName = 'Label';

export const Input = React.forwardRef(({ className, type = 'text', value, title, ...props }, ref) => {
    const resolvedTitle = title ?? (typeof value === 'string' && value.length > 24 ? value : undefined);
    return (
        <input
            ref={ref}
            type={type}
            value={value}
            title={resolvedTitle}
            className={cn('form-input min-h-[48px] sm:min-h-[44px] px-4 rounded-xl', className)}
            {...props}
        />
    );
});
Input.displayName = 'Input';

export const PasswordInput = React.forwardRef(({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative w-full">
            <input
                ref={ref}
                type={show ? 'text' : 'password'}
                className={cn('form-input min-h-[48px] sm:min-h-[44px] px-4 pe-10 rounded-xl', className)}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted hover:text-ink cursor-pointer"
                tabIndex={-1}
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
});
PasswordInput.displayName = 'PasswordInput';

export const SearchInput = React.forwardRef(({ className, ...props }, ref) => (
    <div className="relative w-full">
        <span className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-muted">
            <Search className="h-4 w-4" />
        </span>
        <input
            ref={ref}
            type="search"
            className={cn('form-input min-h-[48px] sm:min-h-[44px] ps-9 pe-4 rounded-xl', className)}
            placeholder="Search..."
            {...props}
        />
    </div>
));
SearchInput.displayName = 'SearchInput';

export const NumberInput = React.forwardRef(({ className, ...props }, ref) => (
    <input ref={ref} type="number" className={cn('form-input min-h-[48px] sm:min-h-[44px] px-4 rounded-xl tabular-nums', className)} {...props} />
));
NumberInput.displayName = 'NumberInput';

export const Checkbox = React.forwardRef(({ label, className, disabled, ...props }, ref) => {
    if (!label) {
        return (
            <input
                ref={ref}
                type="checkbox"
                disabled={disabled}
                className={cn('form-checkbox', className)}
                {...props}
            />
        );
    }
    return (
        <label className={cn('inline-flex items-center gap-2 select-none text-[13px] min-h-[44px]', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
            <input
                ref={ref}
                type="checkbox"
                disabled={disabled}
                className={cn('form-checkbox', className)}
                {...props}
            />
            <span className="text-ink">{label}</span>
        </label>
    );
});
Checkbox.displayName = 'Checkbox';

export const Radio = React.forwardRef(({ label, className, disabled, ...props }, ref) => {
    if (!label) {
        return (
            <input
                ref={ref}
                type="radio"
                disabled={disabled}
                className={cn('form-radio', className)}
                {...props}
            />
        );
    }
    return (
        <label className={cn('inline-flex items-center gap-2 select-none text-[13px] min-h-[44px]', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
            <input
                ref={ref}
                type="radio"
                disabled={disabled}
                className={cn('form-radio', className)}
                {...props}
            />
            <span className="text-ink">{label}</span>
        </label>
    );
});
Radio.displayName = 'Radio';

export function ValidationMessage({ error, hint, className }) {
    if (!error && !hint) return null;
    return (
        <p role={error ? 'alert' : undefined} className={cn(error ? 'form-error' : 'form-hint', className)}>
            {error || hint}
        </p>
    );
}

export const Switch = Toggle;
export const Textarea = Area;
export const Select = Sel;
