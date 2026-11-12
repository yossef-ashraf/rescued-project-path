
export function extractDbYears(months = []) {
  if (!Array.isArray(months) || months.length === 0) {
    return [String(new Date().getFullYear())];
  }
  const yearSet = new Set();
  months.forEach(m => {
    if (m && m.year) {
      yearSet.add(String(m.year));
    }
  });
  const sorted = Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a));
  return sorted.length > 0 ? sorted : [String(new Date().getFullYear())];
}

export function buildDynamicReportTabs(years = []) {
  const yearTabs = years.map((yr, idx) => {
    const icons = ['📅', '📆', '🗓️', '🕒', '🗓️'];
    const colors = [
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      'bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/40',
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40',
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40'
    ];
    return {
      name: yr,
      icon: icons[idx % icons.length],
      color: colors[idx % colors.length]
    };
  });

  return [
    { name: 'الرئيسية', icon: '🏠', color: 'bg-[#BC5C29]/15 text-[#BC5C29] dark:text-[#BC5C29] border-[#BC5C29]/40' },
    ...yearTabs,
    { name: 'إستثمارات الذهب', icon: '🪙', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40' },
    { name: 'إحصائيات المبالغ', icon: '📊', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40' }
  ];
}
