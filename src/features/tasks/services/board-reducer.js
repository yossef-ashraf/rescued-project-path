
export function moveTaskBetweenColumns(columns, taskId, sourceColumnId, targetColumnId) {
    if (!Array.isArray(columns)) {
        return { columns: [], movedTask: null };
    }

    if (sourceColumnId === targetColumnId) {
        return { columns, movedTask: null };
    }

    const strTaskId = String(taskId);
    let taskToMove = null;

    const sourceCol = columns.find(col => col.id === sourceColumnId);
    if (sourceCol && Array.isArray(sourceCol.tasks)) {
        taskToMove = sourceCol.tasks.find(t => String(t.id) === strTaskId || String(t.id).replace(/^task-/, '') === strTaskId);
    }

    if (!taskToMove) {
        for (const col of columns) {
            const found = col.tasks?.find(t => String(t.id) === strTaskId || String(t.id).replace(/^task-/, '') === strTaskId);
            if (found) {
                taskToMove = found;
                break;
            }
        }
    }

    if (!taskToMove) {
        return { columns, movedTask: null };
    }

    const nextColumns = columns.map(col => {
        if (col.id === sourceColumnId) {
            return {
                ...col,
                tasks: (col.tasks || []).filter(t => String(t.id) !== String(taskToMove.id))
            };
        }
        if (col.id === targetColumnId) {
            return {
                ...col,
                tasks: [...(col.tasks || []), { ...taskToMove, status: targetColumnId }]
            };
        }
        return col;
    });

    return {
        columns: nextColumns,
        movedTask: taskToMove
    };
}

export function updateTaskStatusInList(tasks, taskId, targetStatus) {
    if (!Array.isArray(tasks)) return [];
    const cleanId = String(taskId).replace(/^task-/, '');

    return tasks.map(task => {
        if (String(task.id) === cleanId) {
            return {
                ...task,
                status: targetStatus
            };
        }
        return task;
    });
}
