import React from 'react';
import { Edit3 } from 'lucide-react';

export function filterAndSortMonths(months = [], search = '', sortField = 'id', sortDirection = 'desc') {
  const filtered = months.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.month || '').toLowerCase().includes(q) ||
      String(m.year || '').includes(q) ||
      `${m.month} ${m.year}`.toLowerCase().includes(q)
    );
  });

  return [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'month_year') {
      valA = `${a.year}-${a.month}`;
      valB = `${b.year}-${b.month}`;
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (!isNaN(Number(valA)) && !isNaN(Number(valB)) && valA !== '' && valB !== '') {
      return sortDirection === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }

    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}

export function formatTimelineItems(sortedMonths = [], t, onEdit) {
  return sortedMonths.map(m => {
    const netBal = Number(m.balance || 0);
    const isPos = netBal >= 0;
    const revLabel = t ? t("Rev", "إيراد") : "Rev";
    const expLabel = t ? t("Exp", "مصروف") : "Exp";
    const editLabel = t ? t("Edit", "تعديل") : "Edit";

    return {
      id: String(m.id),
      title: `${m.month} ${m.year}`,
      description: `${revLabel}: ${Number(m.revenue || 0).toLocaleString()} | ${expLabel}: ${Number(m.expenses || 0).toLocaleString()}`,
      timestamp: `${m.year}-${m.month}`,
      status: isPos ? 'completed' : 'error',
      content: (
        <div className="flex items-center justify-between gap-2 mt-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <span className={`text-xs font-extrabold font-mono tabular-nums ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPos ? '+' : ''}{netBal.toLocaleString()} EGP
          </span>
          <button
            onClick={() => onEdit(m)}
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{editLabel}</span>
          </button>
        </div>
      )
    };
  });
}
