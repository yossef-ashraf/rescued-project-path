import { MONTH_ORDER_MAP } from '../constants/credits.constants.js';
import { getCreditTypeInfo } from '../services/categories.js';

export function calculateTotalCredits(items = []) {
  return items.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
}

export function getCreditColorClasses(type) {
  const info = getCreditTypeInfo(type);
  return info.color;
}

export function getTypeLabel(type, t) {
  const info = getCreditTypeInfo(type);
  return t ? t(info.labelEn, info.labelAr) : info.labelEn;
}

export function getMonthNum(item) {
  if (item.month_id && !isNaN(Number(item.month_id))) return Number(item.month_id);
  if (item.month && !isNaN(Number(item.month))) return Number(item.month);
  const mStr = String(item.month_name || '').toLowerCase().trim();
  return MONTH_ORDER_MAP[mStr] || 0;
}

export function sortCredits(items = [], sortField = 'natural', sortDirection = 'desc') {
  return [...items].sort((a, b) => {
    if (!sortField || sortField === 'natural' || sortField === 'default') {
      const yA = Number(a.month_year || a.year || 0);
      const yB = Number(b.month_year || b.year || 0);
      if (yA !== yB) return sortDirection === 'asc' ? yA - yB : yB - yA;

      const mA = getMonthNum(a);
      const mB = getMonthNum(b);
      if (mA !== mB) return sortDirection === 'asc' ? mA - mB : mB - mA;

      const wA = Number(a.week || 1);
      const wB = Number(b.week || 1);
      if (wA !== wB) return sortDirection === 'asc' ? wA - wB : wB - wA;

      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      return sortDirection === 'asc' ? idA - idB : idB - idA;
    }

    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'amount') {
      valA = Number(a.amount || 0);
      valB = Number(b.amount || 0);
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    return sortDirection === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}
