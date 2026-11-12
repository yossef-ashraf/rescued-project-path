export function filterOverviewTasks(tasks, searchQuery, teamFilter, statusFilter, priorityFilter) {
    return tasks.filter(t => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const titleMatch = t.title?.toLowerCase().includes(q);
            const compMatch = t.company?.toLowerCase().includes(q);
            const descMatch = t.description?.toLowerCase().includes(q);
            if (!titleMatch && !compMatch && !descMatch) return false;
        }
        if (teamFilter !== 'all' && (t.company || 'General') !== teamFilter) return false;
        if (statusFilter !== 'all') {
            const normalized = (t.status === 'pending' ? 'todo' : (t.status === 'completed' ? 'done' : (t.status || 'todo')));
            if (normalized !== statusFilter) return false;
        }
        if (priorityFilter !== 'all') {
            const p = (t.priority || 'Medium').toLowerCase();
            const pf = priorityFilter.toLowerCase();
            if (p !== pf && t.priority !== priorityFilter) return false;
        }
        return true;
    });
}

export function getSourceTag(item) {
    if (item.type === 'note') return '[NT]';
    if (item.project_id || item.type === 'project-task' || item.type === 'project_task') return '[PT]';
    return '[ME]';
}

export function getStatsCourses(courses) {
    return courses.filter(c => c.include_in_stats !== 0 && c.include_in_stats !== '0' && c.include_in_stats !== false);
}

export function getRootCategories(statsCourses) {
    return statsCourses.filter(c => !c.parent_id || c.parent_id === 'null' || c.parent_id === 'none');
}

export function calculateCategoryCompletion(statsCourses, rootCategories) {
    return rootCategories.map(root => {
        let totalUnits = 0;
        let completedUnits = 0;

        const calc = (parentId) => {
            const children = statsCourses.filter(i => String(i.parent_id) === String(parentId));
            children.forEach(ch => {
                if (ch.type === 'course') {
                    totalUnits += (ch.total_units || 1);
                    completedUnits += (ch.completed_units || 0);
                }
                calc(ch.id);
            });
        };
        calc(root.id);

        const rate = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
        return {
            category: root.title,
            rate: rate || 5
        };
    });
}

export function calculateCategoryVolume(statsCourses, rootCategories) {
    return rootCategories.map(root => {
        let totalItems = 0;
        const calc = (parentId) => {
            const children = statsCourses.filter(i => String(i.parent_id) === String(parentId));
            totalItems += children.length;
            children.forEach(ch => calc(ch.id));
        };
        calc(root.id);

        return {
            category: root.title,
            count: totalItems || 1
        };
    });
}

export function calculateCourseProgress(statsCourses) {
    const onlyCourses = statsCourses.filter(c => c.type === 'course');
    const sorted = [...onlyCourses].sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0)).slice(0, 6);

    return sorted.map(c => ({
        subject: c.title.length > 12 ? c.title.substring(0, 12) + '..' : c.title,
        progress: Number(c.progress_percentage) || 10
    }));
}

export function calculateCourseUnits(statsCourses) {
    const onlyCourses = statsCourses.filter(c => c.type === 'course');
    const sorted = [...onlyCourses].sort((a, b) => (b.total_units || 0) - (a.total_units || 0)).slice(0, 6);

    return sorted.map(c => ({
        subject: c.title.length > 12 ? c.title.substring(0, 12) + '..' : c.title,
        units: Number(c.total_units) || 1
    }));
}

export function format3DaysEndDate(startStr, endStr) {
    if (endStr && endStr !== startStr) return endStr;
    const s = new Date(startStr);
    s.setDate(s.getDate() + 2);
    return s.toISOString().split('T')[0];
}

export function getTaskBarPosition(task, granularity, startDateWindow, selMonth, selYear, daysInSelMonth, todayStr) {
    const startStr = task.due_date || task.start_date || todayStr;
    const endStr = task.end_date || format3DaysEndDate(startStr, null);

    const sDate = new Date(startStr);
    const eDate = new Date(endStr);

    if (granularity === 'months') {
        const startDiff = (sDate.getFullYear() - startDateWindow.getFullYear()) * 12 + (sDate.getMonth() - startDateWindow.getMonth()) + (sDate.getDate() - 1) / 30;
        const endDiff = (eDate.getFullYear() - startDateWindow.getFullYear()) * 12 + (eDate.getMonth() - startDateWindow.getMonth()) + (eDate.getDate() - 1) / 30;

        let left = (startDiff / 12) * 100;
        let right = (endDiff / 12) * 100;

        left = Math.max(0, Math.min(84, left));
        right = Math.max(left + 16, Math.min(100, right));
        return { left: `${left.toFixed(2)}%`, width: `${(right - left).toFixed(2)}%` };
    }

    let sDay = sDate.getDate();
    let eDay = eDate.getDate();

    if (sDate.getMonth() !== selMonth || sDate.getFullYear() !== selYear) sDay = 1;
    if (eDate.getMonth() !== selMonth || eDate.getFullYear() !== selYear) eDay = daysInSelMonth;

    if (granularity === 'weeks') {
        const getWeekIdx = (day) => {
            if (day <= 7) return 0;
            if (day <= 14) return 1;
            if (day <= 21) return 2;
            if (day <= 28) return 3;
            return 4;
        };
        const sWeek = getWeekIdx(sDay);
        const eWeek = getWeekIdx(eDay);
        let left = (sWeek / 5) * 100;
        let right = ((eWeek + 1) / 5) * 100;
        left = Math.max(0, Math.min(80, left));
        right = Math.max(left + 20, Math.min(100, right));
        return { left: `${left.toFixed(2)}%`, width: `${(right - left).toFixed(2)}%` };
    }

    let left = ((sDay - 1) / daysInSelMonth) * 100;
    let right = (eDay / daysInSelMonth) * 100;

    const minWidth = granularity === 'days' ? 16 : 20;
    left = Math.max(0, Math.min(100 - minWidth, left));
    right = Math.max(left + minWidth, Math.min(100, right));
    return { left: `${left.toFixed(2)}%`, width: `${(right - left).toFixed(2)}%` };
}

export function calculateTodayPositionPercent(granularity, startDateWindow, selMonth, selYear, daysInSelMonth) {
    const today = new Date();
    if (granularity === 'months') {
        const diff = (today.getFullYear() - startDateWindow.getFullYear()) * 12 + (today.getMonth() - startDateWindow.getMonth()) + (today.getDate() - 1) / 30;
        const pct = (diff / 12) * 100;
        return Math.max(0, Math.min(100, pct));
    }

    if (today.getMonth() === selMonth && today.getFullYear() === selYear) {
        if (granularity === 'weeks') {
            const d = today.getDate();
            const wIdx = d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : d <= 28 ? 3 : 4;
            const pct = ((wIdx + 0.5) / 5) * 100;
            return Math.max(0, Math.min(100, pct));
        }
        const pct = ((today.getDate() - 1) / daysInSelMonth) * 100;
        return Math.max(0, Math.min(100, pct));
    }
    return -1;
}
