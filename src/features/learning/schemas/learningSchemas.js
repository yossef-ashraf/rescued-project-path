/**
 * Learning Feature Validation Schemas
 * Architecture v2
 */

export const courseSchema = {
    title: { type: 'string', required: true, message: 'عنوان الدورة مطلوب' },
    url: { type: 'string', required: false },
    category_path: { type: 'string', required: false, default: 'عام' },
    resource_type: { type: 'string', required: false, default: 'course' },
    total_units: { type: 'number', required: false, default: 0 },
    completed_units: { type: 'number', required: false, default: 0 },
    status: {
        type: 'string',
        required: false,
        enum: ['not_started', 'in_progress', 'completed', 'paused', 'archived'],
        default: 'not_started'
    },
    description: { type: 'string', required: false },
    presenter_name: { type: 'string', required: false },
    presenter_description: { type: 'string', required: false },
    include_in_stats: { type: 'number', required: false, default: 1 },
    start_date: { type: 'string', required: false },
    expected_end_date: { type: 'string', required: false }
};

export const lessonSchema = {
    title: { type: 'string', required: true, message: 'عنوان الدرس مطلوب' },
    course_id: { type: 'number', required: true, message: 'معرف الدورة مطلوب' },
    content: { type: 'string', required: false, default: '' },
    order_index: { type: 'number', required: false, default: 0 },
    duration_minutes: { type: 'number', required: false, default: 0 },
    is_completed: { type: 'boolean', required: false, default: false }
};

export const materialSchema = {
    file_name: { type: 'string', required: true, message: 'اسم الملف أو المورد مطلوب' },
    course_id: { type: 'number', required: false },
    file_url: { type: 'string', required: true, message: 'رابط الملف مطلوب' },
    file_type: { type: 'string', required: false, default: 'document' },
    reading_status: { type: 'string', required: false, default: 'unread' },
    tags: { type: 'string', required: false }
};

const serviceExports = {
    courseSchema,
    lessonSchema,
    materialSchema
};

export default serviceExports;
