import { Op } from '@/shared/database/orm.js';
import { sequelize } from '@/shared/database/database.js';
import { Task, TodoItem, TaskComment, TaskAttachment } from '@/shared/models/index.js';
import { requireAuth, ok, unauthorized, notFound, badRequest } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';
import { getEgyptDateStr } from '@/shared/utils/timezone.js';
import { generateTodoExport } from '@/features/tasks/services/todo-export.js';
import { sendTelegramNotification } from '@/features/settings/services/telegram-integration.js';
import { TaskStatus, TaskPriority, isTaskDone } from '@/shared/enums/index.js';

export function getMatchingDatesForWeekdays(startDateStr, endDateStr, selectedDays) {
    if (!startDateStr) return [getEgyptDateStr ? getEgyptDateStr() : new Date().toISOString().split('T')[0]];

    const daysArray = Array.isArray(selectedDays) ? selectedDays : String(selectedDays || '').split(',');
    if (!daysArray || daysArray.length === 0 || (daysArray.length === 1 && !daysArray[0])) {
        return [startDateStr];
    }

    const dayNameToIndex = {
        'Sun': 0, 'الأحد': 0, '0': 0,
        'Mon': 1, 'الإثنين': 1, '1': 1,
        'Tue': 2, 'الثلاثاء': 2, '2': 2,
        'Wed': 3, 'الأربعاء': 3, '3': 3,
        'Thu': 4, 'الخميس': 4, '4': 4,
        'Fri': 5, 'الجمعة': 5, '5': 5,
        'Sat': 6, 'السبت': 6, '6': 6
    };

    const targetDayIndices = daysArray.map(d => dayNameToIndex[String(d).trim()]).filter(d => d !== undefined);
    if (targetDayIndices.length === 0) return [startDateStr];

    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const endStr = endDateStr || startDateStr;
    const [eY, eM, eD] = endStr.split('-').map(Number);

    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    const results = [];
    const current = new Date(start);

    let safety = 0;
    while (current <= end && safety < 365) {
        if (targetDayIndices.includes(current.getDay())) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            results.push(`${y}-${m}-${d}`);
        }
        current.setDate(current.getDate() + 1);
        safety++;
    }

    return results.length > 0 ? results : [startDateStr];
}

export class TasksController {
    static async exportTodo(req) {
        const user = await requireAuth(req);
        if (!user) return unauthorized();
        return generateTodoExport(req);
    }

    static async getTasks(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const url = new URL(req.url);
            const taskId = url.searchParams.get('taskId') || url.searchParams.get('id');

            if (taskId) {
                const task = await Task.findByPk(taskId);
                if (!task) return notFound('Task not found');

                const [comments, attachments] = await Promise.all([
                    TaskComment.findAll({ where: { task_id: taskId }, order: [['id', 'DESC']], raw: true }),
                    TaskAttachment.findAll({ where: { task_id: taskId }, order: [['id', 'DESC']], raw: true })
                ]);

                return ok({
                    ...task.toJSON(),
                    comments: comments || [],
                    attachments: attachments || []
                });
            }

            const company = url.searchParams.get('company');
            const status = url.searchParams.get('status');

            const whereClause = {};
            if (company) whereClause.company = company;
            if (status) whereClause.status = status;

            const tasks = await Task.findAll({
                where: whereClause,
                order: [['due_date', 'ASC'], ['id', 'DESC']]
            });

            return ok(tasks);
        } catch (err) {
            return apiError(err);
        }
    }

    static async handleTaskAction(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const body = await req.json();
            const {
                action, title, description, status, company, taskId, id, comment,
                fileName, filePath, fileSize, fileType, due_date, end_date, is_daily,
                reminder_time, is_recurring, repeat_days, start_date, parent_task_id,
                priority, commentId, attachmentId
            } = body;

            const targetTaskId = taskId || id;

            if (action === 'create_task' || action === 'create_todo_point' || action === 'add_task' || action === 'create') {
                const isRec = (is_recurring === 1 || is_recurring === true || is_recurring === '1') ? 1 : 0;
                const repeatDaysStr = Array.isArray(repeat_days) ? repeat_days.join(',') : (repeat_days || null);
                const rTime = reminder_time || null;
                const sDate = start_date || due_date || new Date().toISOString().split('T')[0];
                const eDate = end_date || sDate;
                const taskPriority = priority || TaskPriority.MEDIUM;

                if (isRec && repeatDaysStr) {
                    const matchingDates = getMatchingDatesForWeekdays(sDate, eDate, repeatDaysStr);
                    for (const d of matchingDates) {
                        await Task.create({
                            title,
                            description: description || null,
                            status: status || TaskStatus.PENDING,
                            company: company || null,
                            due_date: d,
                            start_date: sDate,
                            end_date: eDate,
                            is_daily: is_daily ? 1 : 0,
                            reminder_time: rTime,
                            is_recurring: 1,
                            repeat_days: repeatDaysStr,
                            parent_task_id: parent_task_id || null,
                            priority: taskPriority,
                            created_at: new Date(),
                            updated_at: new Date().toISOString()
                        });
                    }
                    return ok({ success: true, count: matchingDates.length });
                } else {
                    const created = await Task.create({
                        title,
                        description: description || null,
                        status: status || TaskStatus.PENDING,
                        company: company || null,
                        due_date: sDate,
                        start_date: sDate,
                        end_date: sDate,
                        is_daily: is_daily ? 1 : 0,
                        reminder_time: rTime,
                        is_recurring: 0,
                        repeat_days: null,
                        parent_task_id: parent_task_id || null,
                        priority: taskPriority,
                        created_at: new Date(),
                        updated_at: new Date().toISOString()
                    });
                    return ok({ success: true, id: created.id });
                }
            }

            if (action === 'update_task_status' || action === 'update_status') {
                if (!targetTaskId) return badRequest('Missing taskId');
                const targetTask = await Task.findByPk(targetTaskId, { raw: true });
                const [updated] = await Task.update({
                    status,
                    updated_at: new Date()
                }, { where: { id: targetTaskId } });
                if (updated === 0) return notFound('Task not found');

                if (isTaskDone(status) && targetTask) {
                    try {
                        const notifTitle = `🎉 تم إنجاز المهمة (Task)!`;
                        const notifMessage = `تم تحويل حالة المهمة <b>"${targetTask.title}"</b> إلى مكتملة!\nعمل ممتاز، استمر في التألق! 🌟`;
                        sendTelegramNotification({
                            title: notifTitle,
                            message: notifMessage,
                            link: `/tasks`,
                            type: 'success',
                            priority: 'normal'
                        }).catch(() => { });
                    } catch (_) { }
                }

                return ok({ success: true });
            }

            if (action === 'edit_task' || action === 'update_task' || action === 'update' || action === 'edit') {
                if (!targetTaskId) return badRequest('Missing taskId');
                const updatePayload = {
                    updated_at: new Date()
                };
                if (title !== undefined) updatePayload.title = title ? title.trim() : 'Task';
                if (description !== undefined) updatePayload.description = description || null;
                if (company !== undefined) updatePayload.company = company || null;
                if (due_date !== undefined) updatePayload.due_date = due_date || null;
                if (end_date !== undefined) updatePayload.end_date = end_date || null;
                if (start_date !== undefined) updatePayload.start_date = start_date || null;
                if (priority !== undefined) updatePayload.priority = priority || TaskPriority.MEDIUM;
                if (status !== undefined) updatePayload.status = status;
                if (reminder_time !== undefined) updatePayload.reminder_time = reminder_time || null;
                if (is_recurring !== undefined) updatePayload.is_recurring = is_recurring ? 1 : 0;
                if (repeat_days !== undefined) updatePayload.repeat_days = Array.isArray(repeat_days) ? repeat_days.join(',') : (repeat_days || null);

                const [updated] = await Task.update(updatePayload, { where: { id: targetTaskId } });
                if (updated === 0) return notFound('Task not found');
                return ok({ success: true });
            }

            if (action === 'delete_task' || action === 'delete') {
                await TasksController._cascadeDeleteTask(targetTaskId);
                return ok({ success: true });
            }

            if (action === 'add_comment') {
                await TaskComment.create({
                    task_id: targetTaskId,
                    comment,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                return ok({ success: true });
            }

            if (action === 'add_attachment') {
                await TaskAttachment.create({
                    task_id: targetTaskId,
                    file_name: fileName,
                    file_path: filePath,
                    file_size: fileSize ? String(fileSize) : '0',
                    file_type: fileType || 'unknown',
                    created_at: new Date(),
                    updated_at: new Date()
                });
                return ok({ success: true });
            }

            if (action === 'delete_comment') {
                const cId = commentId || id;
                if (!cId) return badRequest('Missing commentId');
                const deleted = await TaskComment.destroy({ where: { id: cId } });
                if (!deleted) return notFound('Comment not found');
                return ok({ success: true });
            }

            if (action === 'delete_attachment') {
                const aId = attachmentId || id;
                if (!aId) return badRequest('Missing attachmentId');
                const deleted = await TaskAttachment.destroy({ where: { id: aId } });
                if (!deleted) return notFound('Attachment not found');
                return ok({ success: true });
            }

            return badRequest('Invalid action');
        } catch (err) {
            return apiError(err);
        }
    }

    static async deleteTask(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            let id = null;
            try {
                const { searchParams } = new URL(req.url);
                id = searchParams.get('id') || searchParams.get('taskId');
            } catch (_) { }

            if (!id) {
                try {
                    const b = await req.json();
                    id = b?.id || b?.taskId;
                } catch (_) { }
            }

            if (!id) return badRequest('Task ID is missing');

            try {
                await TasksController._cascadeDeleteTask(id);
            } catch (e) {
                if (e.notFound) return notFound('Task not found');
                throw e;
            }
            return ok({ success: true });
        } catch (err) {
            return apiError(err);
        }
    }

    static async _cascadeDeleteTask(id) {
        const deleted = await sequelize.transaction(async (t) => {
            await TaskComment.destroy({ where: { task_id: id }, transaction: t });
            await TaskAttachment.destroy({ where: { task_id: id }, transaction: t });
            return await Task.destroy({ where: { id }, transaction: t });
        });
        if (!deleted) throw Object.assign(new Error('Task not found'), { notFound: true });
    }

    static _todoCategoryEnsured = true;
    static async ensureTodoCategoryColumn() {
        // Runtime DDL removed. Schema migrations are managed in app/shared/migrations/
        if (TasksController._todoCategoryEnsured) return;
        TasksController._todoCategoryEnsured = true;
    }

    static async getTodoItems(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            await TasksController.ensureTodoCategoryColumn();

            const items = await TodoItem.findAll({
                order: [['due_date', 'ASC'], ['id', 'ASC']]
            });

            const formatted = items.map(item => {
                let dDate = item.due_date;
                if (dDate instanceof Date) {
                    const y = dDate.getFullYear();
                    const m = String(dDate.getMonth() + 1).padStart(2, '0');
                    const d = String(dDate.getDate()).padStart(2, '0');
                    dDate = `${y}-${m}-${d}`;
                } else if (typeof dDate === 'string' && dDate.includes('T')) {
                    dDate = dDate.substring(0, 10);
                }
                const raw = item.toJSON ? item.toJSON() : item;
                return {
                    ...raw,
                    category: raw.category || 'General',
                    due_date: dDate,
                    done: item.done === 1 || item.done === true ? 1 : 0
                };
            });

            return ok(formatted);
        } catch (err) {
            return apiError(err);
        }
    }

    static async handleTodoAction(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            await TasksController.ensureTodoCategoryColumn();

            const body = await req.json();
            const { action, id, text, category, description, done, due_date, reminder_time, duration_hours, is_recurring, repeat_days, start_date, end_date, series_id } = body;
            const itemCategory = (category || body.category || 'General').trim() || 'General';

            if (action === 'batch_create_todos') {
                const rawItems = Array.isArray(body.items) ? body.items : [];
                const defaultDate = due_date || start_date || (getEgyptDateStr ? getEgyptDateStr() : new Date().toISOString().split('T')[0]);
                const now = new Date();
                const nowIso = now.toISOString();
                const rowsToInsert = [];

                for (const itm of rawItems) {
                    const itmText = (itm.text || itm.title || '').trim();
                    if (!itmText) continue;

                    const itmCat = (itm.category || category || 'General').trim() || 'General';
                    const itmDate = itm.due_date || defaultDate;
                    const itmDur = itm.duration_hours ? parseFloat(itm.duration_hours) : 1.0;
                    const itmRem = itm.reminder_time || null;
                    const itmDesc = itm.description ? itm.description.trim() : null;

                    rowsToInsert.push({
                        text: itmText,
                        category: itmCat,
                        description: itmDesc,
                        done: 0,
                        due_date: itmDate,
                        reminder_time: itmRem,
                        duration_hours: itmDur,
                        repeat_days: null,
                        start_date: itmDate,
                        end_date: itmDate,
                        series_id: null,
                        created_at: now,
                        updated_at: nowIso
                    });
                }

                const createdList = rowsToInsert.length > 0
                    ? await TodoItem.bulkCreate(rowsToInsert)
                    : [];

                return ok({ success: true, count: createdList.length, items: createdList });
            }

            if (action === 'create_todo_point' || action === 'create_todo' || action === 'add_todo' || action === 'create') {
                const isRec = (is_recurring === 1 || is_recurring === true || is_recurring === '1') ? 1 : 0;
                const repeatDaysStr = Array.isArray(repeat_days) ? repeat_days.join(',') : (repeat_days || null);
                const targetDueDate = due_date || start_date || (getEgyptDateStr ? getEgyptDateStr() : new Date().toISOString().split('T')[0]);
                const sDate = start_date || targetDueDate;
                const eDate = end_date || sDate;
                const rTime = reminder_time || null;
                const durHours = duration_hours ? parseFloat(duration_hours) : 1.0;

                if (isRec === 1 && repeatDaysStr) {
                    const seriesId = `series_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                    const matchingDates = getMatchingDatesForWeekdays(sDate, eDate, repeatDaysStr);
                    const now = new Date();
                    const nowIso = now.toISOString();

                    if (matchingDates.length > 0) {
                        const rowsToInsert = matchingDates.map((d) => ({
                            text,
                            category: itemCategory,
                            description: description || null,
                            done: 0,
                            due_date: d,
                            reminder_time: rTime,
                            duration_hours: durHours,
                            repeat_days: repeatDaysStr,
                            start_date: sDate,
                            end_date: eDate,
                            series_id: seriesId,
                            created_at: now,
                            updated_at: nowIso
                        }));
                        await TodoItem.bulkCreate(rowsToInsert);
                    }

                    return ok({ success: true, count: matchingDates.length, dates: matchingDates });
                } else {
                    const createdItem = await TodoItem.create({
                        text,
                        category: itemCategory,
                        description: description || null,
                        done: 0,
                        due_date: targetDueDate,
                        reminder_time: rTime,
                        duration_hours: durHours,
                        repeat_days: null,
                        start_date: targetDueDate,
                        end_date: targetDueDate,
                        series_id: null,
                        created_at: new Date(),
                        updated_at: new Date().toISOString()
                    });
                    return ok({ success: true, id: createdItem.id, count: 1, date: targetDueDate });
                }
            }

            if (action === 'toggle_done') {
                if (!id) return badRequest('Missing item id');
                const targetItem = await TodoItem.findByPk(id, { raw: true });
                const newDone = done ? 1 : 0;
                const [updated] = await TodoItem.update({
                    done: newDone,
                    updated_at: new Date()
                }, { where: { id } });
                if (updated === 0) return notFound('Todo item not found');

                if (newDone === 1 && targetItem) {
                    try {
                        const notifTitle = `✅ تم إنجاز المهمة بنجاح!`;
                        const notifMessage = `أحسنت يا يوسف! تم إنهاء الـ To-Do:\n<b>"${targetItem.text || 'مهمة'}"</b>\nاستمر في التقدم الرائع! 🚀`;
                        sendTelegramNotification({
                            title: notifTitle,
                            message: notifMessage,
                            link: `/tasks/todo`,
                            type: 'success',
                            priority: 'normal'
                        }).catch(() => { });
                    } catch (_) { }
                }

                return ok({ success: true });
            }

            if (action === 'edit_todo' || action === 'update_todo' || action === 'update' || action === 'edit') {
                const targetId = id || body.id || body.todo_id || body.item_id;
                if (!targetId) return badRequest('Missing item id');
                const durHours = duration_hours ? parseFloat(duration_hours) : 1.0;
                const updatePayload = {
                    text: text !== undefined ? text : body.text,
                    description: description !== undefined ? description : (body.description || null),
                    reminder_time: reminder_time !== undefined ? reminder_time : (body.reminder_time || null),
                    duration_hours: durHours,
                    updated_at: new Date()
                };
                if (due_date) updatePayload.due_date = due_date;
                if (body.category !== undefined) {
                    updatePayload.category = String(body.category).trim() || 'General';
                }
                const [updated] = await TodoItem.update(updatePayload, { where: { id: targetId } });
                if (updated === 0) return notFound('Todo item not found');
                return ok({ success: true, id: targetId });
            }

            if (action === 'delete_item' || action === 'delete_todo' || action === 'delete') {
                const targetId = id || body.id || body.todo_id || body.item_id;
                if (!targetId) return badRequest('Missing item id');
                const deleted = await TodoItem.destroy({ where: { id: targetId } });
                if (!deleted) return notFound('Todo item not found');
                return ok({ success: true, id: targetId });
            }

            if (action === 'delete_day') {
                if (!due_date || typeof due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
                    return badRequest('Invalid due_date format');
                }
                const deleted = await TodoItem.destroy({ where: { due_date } });
                return ok({ success: true, count: deleted });
            }

            if (action === 'delete_series') {
                if (!series_id || typeof series_id !== 'string') {
                    return badRequest('Invalid series_id format');
                }
                const deleted = await TodoItem.destroy({
                    where: {
                        series_id: series_id.trim()
                    }
                });
                return ok({ success: true, count: deleted });
            }

            return badRequest('Invalid action');
        } catch (err) {
            return apiError(err);
        }
    }
}



export default TasksController;
