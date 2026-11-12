
export const DEBT_TYPES = Object.freeze({
    LIABILITY: {
        id: 1,
        code: 'liability',
        labelEn: 'Liability / Debt',
        labelAr: 'دين والتزام مستحق',
        color: {
            text: 'text-rose-600 dark:text-rose-400',
            badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            dot: 'bg-rose-500',
            fill: '#EF4444'
        }
    },
    INVESTMENT: {
        id: 2,
        code: 'investment',
        labelEn: 'Asset Investment',
        labelAr: 'استثمار ومخزون',
        color: {
            text: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            dot: 'bg-emerald-500',
            fill: '#10B981'
        }
    },
    OTHER_EXPENSE: {
        id: 0,
        code: 'other_expense',
        labelEn: 'Other Expense',
        labelAr: 'مصروفات أخرى',
        color: {
            text: 'text-amber-600 dark:text-amber-400',
            badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            dot: 'bg-amber-500',
            fill: '#F59E0B'
        }
    }
});

export const CREDIT_TYPES = Object.freeze({
    SALARY: {
        id: 1,
        code: 'salary',
        labelEn: 'Salary',
        labelAr: 'راتب شهري',
        color: {
            badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            dot: 'bg-emerald-500'
        }
    },
    FREELANCE: {
        id: 2,
        code: 'freelance',
        labelEn: 'Freelance',
        labelAr: 'عمل حر ومشاريع',
        color: {
            badge: 'bg-[#BC5C29]/10 text-[#BC5C29] border-[#BC5C29]/20',
            dot: 'bg-[#BC5C29]'
        }
    },
    FIXED: {
        id: 3,
        code: 'fixed_revenue',
        labelEn: 'Fixed Revenue',
        labelAr: 'دخل ثابت',
        color: {
            badge: 'bg-[#BC5C29]/10 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/20',
            dot: 'bg-[#BC5C29]'
        }
    },
    TOTAL: {
        id: 4,
        code: 'total_income',
        labelEn: 'Total Income',
        labelAr: 'إجمالي دخل',
        color: {
            badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
            dot: 'bg-violet-500'
        }
    },
    OTHER_REVENUE: {
        id: 0,
        code: 'other_revenue',
        labelEn: 'Other Revenue',
        labelAr: 'إيرادات أخرى',
        color: {
            badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            dot: 'bg-amber-500'
        }
    }
});

export function getDebtTypeInfo(type) {
    const key = Number(type);
    if (key === 1) return DEBT_TYPES.LIABILITY;
    if (key === 2) return DEBT_TYPES.INVESTMENT;
    return DEBT_TYPES.OTHER_EXPENSE;
}

export function getCreditTypeInfo(type) {
    const key = Number(type);
    if (key === 1) return CREDIT_TYPES.SALARY;
    if (key === 2) return CREDIT_TYPES.FREELANCE;
    if (key === 3) return CREDIT_TYPES.FIXED;
    if (key === 4) return CREDIT_TYPES.TOTAL;
    return CREDIT_TYPES.OTHER_REVENUE;
}
