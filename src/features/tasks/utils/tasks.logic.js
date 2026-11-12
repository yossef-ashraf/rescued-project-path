export function loadActivityLogs() {
    if (typeof window === 'undefined') return [];
    try {
        const savedLogs = localStorage.getItem('dash_tasks_activity');
        return savedLogs ? JSON.parse(savedLogs) : [];
    } catch {
        return [];
    }
}

export function saveActivityLog(actionText, prevLogs) {
    const newLog = {
        id: Date.now(),
        user: 'User',
        action: actionText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newLog, ...(prevLogs || [])].slice(0, 30);
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dash_tasks_activity', JSON.stringify(updated));
        }
    } catch (e) {
        console.error(e);
    }
    return updated;
}

export function filterTasks(tasks, statusFilter, searchQuery) {
    return tasks.filter(t => {
        if (statusFilter === 'todo' && (t.status === 'in_progress' || t.status === 'done')) return false;
        if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
        if (statusFilter === 'done' && t.status !== 'done') return false;
        if (statusFilter === 'review' && (t.status !== 'review' && t.status !== 'testing' && t.status !== 'in_review')) return false;
        if (statusFilter === 'done' && (t.status !== 'done' && t.status !== 'completed')) return false;

        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = (t.title || '').toLowerCase().includes(q);
            const matchDesc = (t.description || '').toLowerCase().includes(q);
            if (!matchTitle && !matchDesc) return false;
        }
        return true;
    });
}

export function calculateTaskCounts(tasks) {
    const now = new Date();
    const todoCount = tasks.filter(t => t.status === 'todo' || !t.status || t.status === 'backlog').length;
    const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
    const reviewCount = tasks.filter(t => t.status === 'review' || t.status === 'testing' || t.status === 'in_review').length;
    const doneCount = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const resolvedCount = doneCount;
    const delayedCount = tasks.filter(t => t.status !== 'done' && t.status !== 'completed' && t.due_date && new Date(t.due_date) < now).length;

    return {
        todoCount,
        inProgressCount,
        reviewCount,
        doneCount,
        resolvedCount,
        delayedCount
    };
}
