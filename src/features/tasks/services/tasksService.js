/**
 * Tasks Service
 * Architecture v2
 */

export function filterAndGroupTodos(todos = []) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = [];
    const today = [];
    const upcoming = [];
    const completed = [];

    todos.forEach((item) => {
        if (Boolean(item.done)) {
            completed.push(item);
            return;
        }

        if (!item.due_date) {
            upcoming.push(item);
            return;
        }

        const due = item.due_date.slice(0, 10);
        if (due < todayStr) {
            overdue.push(item);
        } else if (due === todayStr) {
            today.push(item);
        } else {
            upcoming.push(item);
        }
    });

    return {
        total: todos.length,
        completedCount: completed.length,
        pendingCount: todos.length - completed.length,
        overdue,
        today,
        upcoming,
        completed
    };
}

const serviceExports = {
    filterAndGroupTodos
};

export default serviceExports;
