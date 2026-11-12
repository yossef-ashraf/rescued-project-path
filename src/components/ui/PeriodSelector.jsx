'use client';

export const PERIOD_OPTIONS = [
    { key: 'month', labelEn: 'This Month', labelAr: 'الشهر الحالي' },
    { key: '3m',    labelEn: '3M',         labelAr: '3 أشهر' },
    { key: '6m',    labelEn: '6M',         labelAr: '6 أشهر' },
    { key: '9m',    labelEn: '9M',         labelAr: '9 أشهر' },
    { key: 'ytd',   labelEn: 'YTD',        labelAr: 'من بداية السنة' },
    { key: '1y',    labelEn: '1Y',         labelAr: 'سنة كاملة' },
    { key: 'all',   labelEn: 'All',        labelAr: 'الكل' },
];

export const TODO_PERIOD_OPTIONS = [
    { key: 'month', labelEn: 'This Month', labelAr: 'الشهر الحالي' },
    { key: '3m',    labelEn: '3M',         labelAr: '3 شهور' },
    { key: '6m',    labelEn: '6M',         labelAr: '6 شهور' },
    { key: '9m',    labelEn: '9M',         labelAr: '9 شهور' },
    { key: '1y',    labelEn: '12M',        labelAr: '12 شهر' },
    { key: 'all',   labelEn: 'All',        labelAr: 'الكل' },
];

export function getPeriodRange(key, referenceDateStr = null) {
    let y, m;
    if (referenceDateStr && /^\d{4}-\d{2}-\d{2}/.test(referenceDateStr)) {
        const parts = referenceDateStr.split('-');
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
    } else {
        const now = new Date();
        y = now.getFullYear();
        m = now.getMonth();
    }

    switch (key) {
        case 'month': return { start: new Date(y, m, 1),         end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        case '3m':    return { start: new Date(y, m - 2, 1),     end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        case '6m':    return { start: new Date(y, m - 5, 1),     end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        case '9m':    return { start: new Date(y, m - 8, 1),     end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        case 'ytd':   return { start: new Date(y, 0, 1),         end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        case '1y':    return { start: new Date(y - 1, m + 1, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        default:      return null;
    }
}

export function isInPeriod(dateStr, range) {
    if (!range || !dateStr) return true;
    const raw = String(dateStr).trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    const d = isoMatch
        ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0)
        : new Date(raw);
    if (Number.isNaN(d.getTime())) return true;
    return d >= range.start && d <= range.end;
}

export default function PeriodSelector({ value, onChange, t, label, options = PERIOD_OPTIONS }) {
    const list = Array.isArray(options) && options.length > 0 ? options : PERIOD_OPTIONS;

    return (
        <div className="flex items-center justify-between gap-3 max-w-full">
            {label && (
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hidden sm:block shrink-0">
                    {label}
                </span>
            )}
            <div
                role="group"
                aria-label={label || t('Select period', 'اختر الفترة')}
                className="flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs font-bold overflow-x-auto no-scrollbar max-w-full shadow-2xs"
            >
                {list.map(({ key, labelEn, labelAr }) => {
                    const isActive = value === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => onChange(key)}
                            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 text-xs font-semibold ${
                                isActive
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-bold'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            {t ? t(labelEn, labelAr) : labelAr}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
