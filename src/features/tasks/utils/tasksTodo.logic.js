import { getItemDurationHours } from '@/features/tasks/components/ToDoCard';
import { getPeriodRange, isInPeriod } from '@/components/ui/PeriodSelector';

export function filterTodoItems(items, searchQuery, filterStartDate, filterEndDate, selectedCategory) {
    return items.filter(item => {
        if (selectedCategory && selectedCategory !== 'all') {
            const cat = (item.category || 'General').toLowerCase();
            if (cat !== selectedCategory.toLowerCase()) return false;
        }

        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchText = (item.text && item.text.toLowerCase().includes(q)) ||
                (item.description && item.description.toLowerCase().includes(q)) ||
                (item.category && item.category.toLowerCase().includes(q));
            if (!matchText) return false;
        }

        if (filterStartDate && item.due_date && item.due_date < filterStartDate) return false;
        if (filterEndDate && item.due_date && item.due_date > filterEndDate) return false;

        return true;
    });
}

export function groupTodoItemsByDate(filteredItems, language) {
    return filteredItems.reduce((acc, item) => {
        const dateKey = item.due_date || (language === 'ar' ? 'بدون تاريخ' : 'No Date');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {});
}

export function formatHours(num) {
    if (!num || isNaN(num)) return 0;
    return Math.round(Number(num) * 10) / 10;
}

export function calculateTodayStats(todayItems) {
    const todayTotal = todayItems.length;
    const todayCompleted = todayItems.filter(i => Boolean(i.done)).length;
    const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    const rawTotalHours = todayItems.reduce((sum, item) => sum + getItemDurationHours(item), 0);
    const rawCompletedHours = todayItems.filter(i => Boolean(i.done)).reduce((sum, item) => sum + getItemDurationHours(item), 0);

    const todayTotalHours = formatHours(rawTotalHours);
    const todayCompletedHours = formatHours(rawCompletedHours);
    const remainingDayHours = Math.max(0, formatHours(24 - todayTotalHours));
    const dayHoursPercent = Math.min(100, Math.round((todayTotalHours / 24) * 100));

    return {
        todayTotal,
        todayCompleted,
        todayPercent,
        todayTotalHours,
        todayCompletedHours,
        remainingDayHours,
        dayHoursPercent
    };
}

export function calculateOverallStats(filteredItems, todayStr, periodKey = 'month') {
    const range = getPeriodRange(periodKey, todayStr);

    // 1. Filter items belonging to the selected period
    const periodItems = filteredItems.filter(item => {
        if (!range || periodKey === 'all') return true;
        if (!item.due_date) return true;
        return isInPeriod(item.due_date, range);
    });

    const totalPeriodItems = periodItems.length;
    const allTimeTotalItems = filteredItems.length;
    const allTimeCompletedItems = filteredItems.filter(i => Boolean(i.done)).length;

    // 2. Count ONLY elapsed items (past days, today, or items already done early)
    // Future uncompleted items (due_date > todayStr and !done) are excluded from the completion rate denominator!
    const elapsedItems = periodItems.filter(item => {
        if (Boolean(item.done)) return true; // completed items always count
        if (!item.due_date) return true; // undated tasks count as elapsed
        return item.due_date <= todayStr; // past or today
    });

    const elapsedTotal = elapsedItems.length;
    const elapsedCompleted = elapsedItems.filter(i => Boolean(i.done)).length;

    // Future pending items (scheduled strictly after today and not yet completed)
    const futurePendingItems = periodItems.filter(i => !Boolean(i.done) && i.due_date && i.due_date > todayStr).length;

    // 3. Completion rate based strictly on elapsed days
    const overallPercentage = elapsedTotal > 0
        ? Math.round((elapsedCompleted / elapsedTotal) * 100)
        : (totalPeriodItems > 0 && elapsedCompleted === 0 ? 0 : 100);

    // 4. Overdue items in the period
    const overduePeriodItems = periodItems.filter(i => {
        if (Boolean(i.done)) return false;
        if (i.due_date && i.due_date < todayStr) return true;
        if (i.due_date === todayStr && i.reminder_time) {
            const now = new Date();
            const curHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (i.reminder_time < curHHMM) return true;
        }
        return false;
    }).length;

    let performanceLabel = { en: 'Excellent 🔥', ar: 'أداء ممتاز 🔥' };
    if (overallPercentage < 50) {
        performanceLabel = { en: 'Needs Focus ⚠️', ar: 'يحتاج تركيز ⚠️' };
    } else if (overallPercentage < 75) {
        performanceLabel = { en: 'Very Good 👍', ar: 'أداء جيد جداً 👍' };
    }

    return {
        elapsedTotal,
        elapsedCompleted,
        futurePendingItems,
        totalPeriodItems,
        allTimeTotalItems,
        allTimeCompletedItems,
        overallPercentage,
        overduePeriodItems,
        performanceLabel,

        // Backwards compatibility mappings
        allTotalItems: totalPeriodItems,
        allCompletedItems: elapsedCompleted,
        allOverdueItems: overduePeriodItems
    };
}

export function aggregateMissedTasks(todoItems, todayStr, language, selectedMonth) {
    const missedGroupedMap = {};
    todoItems.forEach(item => {
        const isMissed = !Boolean(item.done) && item.due_date && item.due_date < todayStr;
        if (!isMissed) return;

        if (selectedMonth && selectedMonth !== 'all') {
            if (!item.due_date || !item.due_date.startsWith(selectedMonth)) return;
        }

        const titleKey = item.text ? item.text.trim() : (language === 'ar' ? 'مهمة بدون اسم' : 'Unnamed Task');
        const hours = getItemDurationHours(item);

        if (!missedGroupedMap[titleKey]) {
            missedGroupedMap[titleKey] = {
                title: titleKey,
                count: 0,
                totalHours: 0
            };
        }

        missedGroupedMap[titleKey].count += 1;
        missedGroupedMap[titleKey].totalHours = formatHours(missedGroupedMap[titleKey].totalHours + hours);
    });

    return Object.values(missedGroupedMap).sort((a, b) => b.count - a.count || b.totalHours - a.totalHours);
}

export function getAvailableExportMonths(todoItems) {
    const monthsSet = new Set();
    todoItems.forEach(item => {
        if (item.due_date && item.due_date.length >= 7) {
            monthsSet.add(item.due_date.substring(0, 7));
        }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
}

export function calculateExportStats(todoItems, selectedExportMonth, todayStr) {
    const filtered = selectedExportMonth === 'all'
        ? todoItems
        : todoItems.filter(it => it.due_date && it.due_date.startsWith(selectedExportMonth));

    let total = filtered.length;
    let done = 0;
    let missed = 0;
    let pending = 0;
    let totalHrs = 0;
    let doneHrs = 0;

    filtered.forEach(it => {
        const isDone = Boolean(it.done);
        const hrs = getItemDurationHours(it);
        totalHrs += hrs;

        if (isDone) {
            done += 1;
            doneHrs += hrs;
        } else if (it.due_date && it.due_date < todayStr) {
            missed += 1;
        } else {
            pending += 1;
        }
    });

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
        total,
        done,
        missed,
        pending,
        totalHrs: formatHours(totalHrs),
        doneHrs: formatHours(doneHrs),
        rate
    };
}

export function parseCategoryFromText(text, defaultCategory = 'General') {
    const raw = (text || '').trim();
    const match = raw.match(/^\[([^\]]+)\]\s*(.*)$/) || raw.match(/^\(([^\)]+)\)\s*(.*)$/);
    if (match) {
        const catCandidate = match[1].trim().toLowerCase();
        const remainingText = match[2].trim();
        
        const map = {
            'work': 'Work', 'عمل': 'Work', 'شغل': 'Work', 'وظيفة': 'Work',
            'study': 'Study', 'دراسة': 'Study', 'مذاكرة': 'Study', 'تعليم': 'Study', 'كورس': 'Study',
            'personal': 'Personal', 'شخصي': 'Personal', 'خاص': 'Personal',
            'finance': 'Finance', 'مالي': 'Finance', 'فلوس': 'Finance', 'مصاريف': 'Finance',
            'health': 'Health', 'صحة': 'Health', 'رياضة': 'Health', 'تمرين': 'Health',
            'projects': 'Projects', 'مشاريع': 'Projects', 'مشروع': 'Projects', 'برمجة': 'Projects',
            'general': 'General', 'عام': 'General'
        };

        if (map[catCandidate]) {
            return {
                category: map[catCandidate],
                cleanText: remainingText || raw
            };
        }
    }
    return {
        category: defaultCategory,
        cleanText: raw
    };
}

