/**
 * Operations Validation Schemas
 * Architecture v2
 */

export const projectSchema = {
    name: { type: 'string', required: true, message: 'اسم المشروع مطلوب' },
    description: { type: 'string', required: false },
    status: {
        type: 'string',
        required: false,
        enum: ['planning', 'active', 'completed', 'paused', 'archived'],
        default: 'planning'
    },
    priority: {
        type: 'string',
        required: false,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    start_date: { type: 'string', required: false },
    due_date: { type: 'string', required: false }
};

export const leadSchema = {
    name: { type: 'string', required: true, message: 'اسم العميل أو الجهة مطلوب' },
    email: { type: 'string', required: false },
    phone: { type: 'string', required: false },
    company: { type: 'string', required: false },
    stage: {
        type: 'string',
        required: false,
        enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
        default: 'new'
    },
    value: { type: 'number', required: false, default: 0 },
    notes: { type: 'string', required: false }
};

const serviceExports = {
    projectSchema,
    leadSchema
};

export default serviceExports;
