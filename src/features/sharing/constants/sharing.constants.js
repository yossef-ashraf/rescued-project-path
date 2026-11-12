/**
 * Constants for Sharing Feature (Section 30)
 */

export const ALLOWED_SCOPES = [
    'page',
    'workspace',
    'course',
    'lesson',
    'resource',
    'comment',
    'task',
    'project',
    'profile_section',
    'custom_block',
    'component'
];

export const SCOPE_LABELS_AR = {
    component: 'عنصر / كومبونت محدد',
    page: 'صفحة كاملة',
    workspace: 'مساحة عمل كاملة',
    course: 'كورس كامل',
    lesson: 'محاضرة / درس فردي',
    resource: 'مصدر / رابط تعليمي',
    comment: 'تعليق محدد',
    task: 'مهمة فردية',
    project: 'مشروع',
    profile_section: 'قسم في الملف الشخصي',
    custom_block: 'عنصر / Block مخصص'
};

export const SCOPE_LABELS_EN = {
    component: 'Specific Component',
    page: 'Full Page',
    workspace: 'Full Workspace',
    course: 'Entire Course',
    lesson: 'Single Lesson',
    resource: 'Learning Resource',
    comment: 'Specific Comment',
    task: 'Single Task',
    project: 'Project',
    profile_section: 'Profile Section',
    custom_block: 'Custom Block'
};

export const SCOPE_LABELS = SCOPE_LABELS_AR;

export function getScopeLabel(scope, lang = 'en') {
    if (lang === 'ar') {
        return SCOPE_LABELS_AR[scope] || scope;
    }
    return SCOPE_LABELS_EN[scope] || scope;
}

const serviceExports = {
    ALLOWED_SCOPES,
    SCOPE_LABELS,
    SCOPE_LABELS_AR,
    SCOPE_LABELS_EN,
    getScopeLabel
};

export default serviceExports;
