import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { useApp } from "@/shared/context/AppContext.js";
import { getEgyptDateStr, getEgyptTimeStr, getEgyptNowMins } from "@/shared/utils/timezone.js";

const CONFETTI_COLORS = ["#10b981", "#34d399", "#059669", "#a7f3d0", "#6ee7b7"];

export function formatTime12h(timeStr, lang = 'en') {
  if (!timeStr) return '';
  try {
    const parts = String(timeStr).split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;

    const isAr = lang === 'ar';
    const period = isAr ? (h >= 12 ? 'م' : 'ص') : (h >= 12 ? 'PM' : 'AM');
    h = h % 12;
    if (h === 0) h = 12;

    const formattedH = String(h).padStart(2, '0');
    return `${formattedH}:${m} ${period}`;
  } catch (e) {
    return timeStr;
  }
}

export function getItemDurationHours(item) {
  if (!item) return 1;
  if (item.duration_hours !== undefined && item.duration_hours !== null && !isNaN(parseFloat(item.duration_hours))) {
    return parseFloat(item.duration_hours);
  }
  const txt = (item.text || '').toLowerCase().trim();
  const desc = (item.description || '').toLowerCase().trim();
  const full = txt + ' ' + desc;

  if (full.includes('md') || full.includes('شغل يومي') || full.includes('الشغل اليومي')) {
    return 8;
  }
  if (txt === 'study en' || full.includes('study en')) {
    return 1;
  }
  if (full.includes('en course') || txt === 'en' || full.includes('course') || full.includes('كورس')) {
    return 2;
  }
  if (full.includes('فجر') || full.includes('ظهر') || full.includes('عصر') || full.includes('مغرب') || full.includes('عشاء') || full.includes('صلاة')) {
    return 0.25;
  }
  if (full.includes('استغفار') || full.includes('اشتغفار') || full.includes('istighfar')) {
    return 0.08;
  }
  return 1;
}

export function formatDurationText(hours, lang = 'en') {
  const isAr = lang === 'ar';
  if (!hours || isNaN(hours)) return isAr ? '1س' : '1h';
  const num = parseFloat(hours);
  if (Math.abs(num - (5 / 60)) < 0.01 || num === 0.08) {
    return isAr ? '5د' : '5m';
  }
  if (Math.abs(num - 0.25) < 0.01) {
    return isAr ? '15د' : '15m';
  }
  if (Math.abs(num - 0.5) < 0.01) {
    return isAr ? '30د' : '30m';
  }
  if (Math.abs(num - 0.75) < 0.01) {
    return isAr ? '45د' : '45m';
  }
  if (Math.abs(num - 1) < 0.01) {
    return isAr ? '1س' : '1h';
  }
  if (Math.abs(num - 2) < 0.01) {
    return isAr ? '2س' : '2h';
  }
  const cleanNum = Math.round(num * 10) / 10;
  return isAr ? `${cleanNum}س` : `${cleanNum}h`;
}

export const TODO_CATEGORIES = [
  { id: 'Work', labelEn: 'Work', labelAr: 'عمل', icon: '💼', color: 'blue' },
  { id: 'Study', labelEn: 'Study', labelAr: 'دراسة', icon: '📚', color: 'violet' },
  { id: 'Personal', labelEn: 'Personal', labelAr: 'شخصي', icon: '👤', color: 'emerald' },
  { id: 'Finance', labelEn: 'Finance', labelAr: 'مالي', icon: '💰', color: 'amber' },
  { id: 'Health', labelEn: 'Health', labelAr: 'صحة', icon: '🏃', color: 'rose' },
  { id: 'Projects', labelEn: 'Projects', labelAr: 'مشاريع', icon: '🚀', color: 'cyan' },
  { id: 'General', labelEn: 'General', labelAr: 'عام', icon: '📌', color: 'zinc' },
];

export function getCategoryMeta(categoryName, lang = 'en') {
  if (!categoryName) return null;
  const match = TODO_CATEGORIES.find(c => c.id.toLowerCase() === String(categoryName).toLowerCase().trim());
  if (match) {
    return {
      id: match.id,
      label: lang === 'ar' ? match.labelAr : match.labelEn,
      icon: match.icon,
      color: match.color,
    };
  }
  return {
    id: categoryName,
    label: categoryName,
    icon: '🏷️',
    color: 'zinc',
  };
}

export function getCategoryBadgeClasses(color) {
  switch (color) {
    case 'blue':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'violet':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'amber':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'rose':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  }
}

export function TodoCard({ 
    dateStr, 
    items = [], 
    onToggleItem, 
    onEditItem,
    onDeleteItem, 
    onDeleteDay, 
    onDeleteSeries
}) {
  const { t, language } = useApp();
  const allDone = useMemo(() => items.length > 0 && items.every((i) => Boolean(i.done)), [items]);

  const [celebrating, setCelebrating] = useState(false);
  const [busyIds, setBusyIds] = useState({});
  const wasAllDoneRef = useRef(false);

  const handleItemToggle = async (item) => {
    if (!onToggleItem || busyIds[item.id]) return;
    setBusyIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await onToggleItem(item);
    } finally {
      setBusyIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      wasAllDoneRef.current = true;
      const t1 = setTimeout(() => setCelebrating(true), 10);
      const t2 = setTimeout(() => setCelebrating(false), 4000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (!allDone && wasAllDoneRef.current) {
      wasAllDoneRef.current = false;
    }
  }, [allDone]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const timeA = a.reminder_time || '99:99';
      const timeB = b.reminder_time || '99:99';
      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }
      return (a.text || '').localeCompare(b.text || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [items]);

  const completedCount = useMemo(() => items.filter((i) => Boolean(i.done)).length, [items]);
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getItemTimeStatus = (item) => {
    if (Boolean(item.done)) return 'done';
    
    const curDateStr = getEgyptDateStr();

    if (dateStr && dateStr < curDateStr) return 'overdue';
    if (dateStr && dateStr > curDateStr) return 'pending';

    if (item.reminder_time) {
      const durationH = getItemDurationHours(item);
      const startParts = item.reminder_time.split(':');
      let startMins = parseInt(startParts[0] || 0) * 60 + parseInt(startParts[1] || 0);
      let endMins = startMins + Math.round(durationH * 60);
      
      const currentMins = getEgyptNowMins();

      if (currentMins < startMins) {
        return 'pending';
      } else if (currentMins >= startMins && currentMins < endMins) {
        return 'active';
      } else {
        return 'overdue';
      }
    }
    return 'pending';
  };

  const dateFormatted = useMemo(() => {
    if (!dateStr || dateStr === 'بدون تاريخ' || dateStr === 'No Date') {
      return { date: t('No Date', 'بدون تاريخ'), dayName: '' };
    }
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dayName = dt.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
        const date = `${d}/${m}/${y}`;
        return { date, dayName };
    } catch (e) {
        return { date: dateStr, dayName: '' };
    }
  }, [dateStr, language, t]);

  return (
    <div className="w-full rounded-lg shadow-card border border-line overflow-hidden bg-surface p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between h-full">
      <div className="relative z-10 flex items-center justify-between gap-3 rounded-md bg-line2/70 px-3.5 py-2.5 border border-line mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${allDone ? 'bg-ok' : 'bg-warn'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${allDone ? 'bg-ok' : 'bg-warn'}`}></span>
          </span>
          <div>
            <h3 className="tabular-nums text-[13px] font-semibold text-ink flex items-center gap-1.5">
              <span>{dateFormatted.dayName}</span>
              <span className="text-faint">·</span>
              <span>{dateFormatted.date}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular-nums text-[11px] font-semibold bg-surface text-ink2 px-2.5 py-0.5 rounded-full border border-line">
            {completedCount} / {totalCount} ({percent}%)
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDay && onDeleteDay(dateStr);
            }}
            className="inline-flex h-7 w-7 items-center justify-center text-muted hover:text-crit hover:bg-crit/10 font-semibold text-xs rounded-md transition-colors cursor-pointer"
            title={t("Delete all items for this day", "حذف نقاط هذا اليوم بالكامل")}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 max-h-[460px] overflow-y-auto ltr:pr-1 rtl:pl-1 scrollbar-thin">
        <div className="relative ltr:pl-9 rtl:pr-9 ltr:pr-1 rtl:pl-1 space-y-3 before:absolute ltr:before:left-[15px] rtl:before:right-[15px] before:top-2 before:bottom-3 before:w-[1.5px] before:bg-line">
          {sortedItems.map((item) => {
            const status = getItemTimeStatus(item);
            const isItemBusy = Boolean(busyIds[item.id]);
            const hasDistinctDesc = item.description && item.description.trim().toLowerCase() !== (item.text || '').trim().toLowerCase();

            return (
              <div 
                key={item.id} 
                className={`relative group flex items-start justify-between gap-3 p-1.5 -mx-1.5 rounded-md hover:bg-line2/60 transition-colors ${
                  status === 'done' ? 'opacity-70' : 'opacity-100'
                }`}
              >
              <div 
                role="checkbox"
                aria-checked={status === 'done'}
                tabIndex={0}
                onClick={() => handleItemToggle(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemToggle(item);
                  }
                }}
                aria-label={`${item.text} (${status})`}
                className="absolute ltr:-left-[30px] rtl:-right-[30px] top-1 z-10 cursor-pointer flex items-center justify-center shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isItemBusy ? (
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : status === 'done' ? (
                  <div className="w-6 h-6 rounded-full bg-ok text-white flex items-center justify-center text-xs font-bold shadow-xs transition transform group-hover:scale-105">
                    ✓
                  </div>
                ) : status === 'active' ? (
                  <div className="w-6 h-6 rounded-full bg-warn text-white flex items-center justify-center text-xs font-bold shadow-xs transition transform group-hover:scale-105 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  </div>
                ) : status === 'overdue' ? (
                  <div className="w-6 h-6 rounded-full bg-crit text-white flex items-center justify-center text-xs font-bold shadow-xs transition transform group-hover:scale-105">
                    ✕
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-line bg-surface flex items-center justify-center transition transform group-hover:scale-105 group-hover:border-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-faint"></span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pl-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 
                    onClick={() => handleItemToggle(item)}
                    className={`text-[13.5px] font-semibold cursor-pointer transition-colors ${
                      status === 'done' 
                        ? "text-muted line-through decoration-muted" 
                        : status === 'active' 
                        ? "text-warn" 
                        : status === 'overdue'
                        ? "text-crit"
                        : "text-ink hover:text-primary"
                    }`}
                  >
                    {item.text}
                  </h4>
                  {item.category && item.category !== 'General' && (() => {
                    const cat = getCategoryMeta(item.category, language);
                    return (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-semibold rounded-full border shrink-0 ${getCategoryBadgeClasses(cat.color)}`}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {hasDistinctDesc && (
                  <p className={`text-[12px] mt-0.5 leading-relaxed ${
                    status === 'done' 
                      ? "text-faint line-through" 
                      : "text-muted"
                  }`}>
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 text-[11px] tabular-nums font-medium rounded-md border shrink-0 flex items-center gap-1 ${
                  status === 'done' 
                    ? "bg-line2 text-faint border-line" 
                    : status === 'active' 
                      ? "bg-warn/15 text-warn border-warn/30" 
                      : status === 'overdue'
                        ? "bg-crit/15 text-crit border-crit/30"
                        : "bg-line2 text-ink2 border-line"
                }`}>
                  {item.reminder_time && (
                      <>
                          <span>{formatTime12h(item.reminder_time, language)}</span>
                          <span className="opacity-40">·</span>
                      </>
                  )}
                  <span>⏱️{formatDurationText(getItemDurationHours(item), language)}</span>
                </span>

                {onEditItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}
                    className="inline-flex h-6 w-6 items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors rounded-md shrink-0 cursor-pointer"
                    title={t("Edit item", "تعديل النقطة")}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}

                {item.series_id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSeries && onDeleteSeries(item.series_id);
                    }}
                    className="inline-flex h-6 px-1.5 items-center justify-center text-[10px] font-semibold text-muted hover:text-crit hover:bg-crit/10 border border-line rounded-md transition-colors shrink-0 cursor-pointer"
                    title={t("Delete full recurring series", "حذف سلسلة التكرار بالكامل")}
                  >
                    <span>🔁</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem && onDeleteItem(item);
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center text-muted hover:text-crit hover:bg-crit/10 text-xs transition-colors rounded-md shrink-0 cursor-pointer"
                  title={t("Delete item", "حذف النقطة")}
                >
                  ✕
                </button>
              </div>

            </div>
          );
        })}
        </div>
      </div>

      {allDone && (
        <div className="relative mt-4 pt-3 border-t border-line shrink-0">
          <p className="text-[12px] text-ok font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
            {t("Completed all items for this day", "تم إنجاز كافة نقاط اليوم بنجاح")}
          </p>
          {celebrating && <ConfettiOverlay />}
        </div>
      )}
    </div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 30 });
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {pieces.map((_, i) => {
        const left = (i * 3.33) % 100;
        const delay = (i * 0.08) % 0.5;
        const duration = 2.5 + ((i % 5) * 0.25);
        const size = 6 + (i % 6);
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <span
            key={i}
            className="confetti-piece absolute rounded-full"
            style={{
              left: `${left}%`,
              top: "-10px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              transform: "translateY(0)",
              animation: `confetti-fall ${duration}s ease-in forwards`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
