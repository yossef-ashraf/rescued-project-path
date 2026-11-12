/**
 * Tasks Validation Schemas
 * Architecture v2
 */

export const todoItemSchema = {
    text: { type: 'string', required: true, message: 'نص المهمة مطلوب' },
    description: { type: 'string', required: false },
    category: { type: 'string', required: false, default: 'General' },
    done: { type: 'number', required: false, default: 0 },
    due_date: { type: 'string', required: false },
    reminder_time: { type: 'string', required: false },
    repeat_days: { type: 'string', required: false },
    duration_hours: { type: 'number', required: false, default: 0 }
};

export const taskSchema = {
    title: { type: 'string', required: true, message: 'عنوان المهمة مطلوب' },
    project_id: { type: 'number', required: false },
    status: {
        type: 'string',
        required: false,
        enum: ['todo', 'in_progress', 'review', 'done'],
        default: 'todo'
    },
    priority: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    due_date: { type: 'string', required: false }
};

const serviceExports = {
    todoItemSchema,
    taskSchema
};

export default serviceExports;
