import Course from '../../../shared/models/Course.js';
import LearningLesson from '../../../shared/models/LearningLesson.js';
import LearningLessonResource from '../../../shared/models/LearningLessonResource.js';
import Task from '../../../shared/models/Task.js';
import Project from '../../../shared/models/Project.js';
import CourseComment from '../../../shared/models/CourseComment.js';
import TaskComment from '../../../shared/models/TaskComment.js';
import LeadComment from '../../../shared/models/LeadComment.js';
import { sanitizeSharedEntity } from './share-sanitizer.service.js';

/**
 * Service: Share Scope Resolver
 * Section 30 — Master Plan
 */

import { ALLOWED_SCOPES } from '../constants/sharing.constants.js';

export { ALLOWED_SCOPES };

export async function resolveScopeEntity(scopeType, scopeId, selector = null) {
    if (!ALLOWED_SCOPES.includes(scopeType)) {
        throw new Error(`Invalid scope type: ${scopeType}`);
    }

    let result = null;
    const numId = Number(scopeId);

    switch (scopeType) {
        case 'course':
            if (numId) {
                result = await Course.findByPk(numId, {
                    attributes: [
                        'id', 'title', 'category_path', 'resource_type',
                        'total_units', 'completed_units', 'progress_percentage',
                        'description', 'presenter_name', 'status', 'url'
                    ],
                    include: [
                        {
                            model: LearningLesson,
                            as: 'lessons',
                            attributes: ['id', 'lesson_number', 'title', 'description', 'duration_minutes', 'status', 'progress_percentage', 'content', 'summary'],
                            required: false
                        }
                    ],
                    order: [
                        [{ model: LearningLesson, as: 'lessons' }, 'lesson_number', 'ASC']
                    ]
                });
            }
            break;

        case 'lesson':
            if (numId) {
                result = await LearningLesson.findByPk(numId, {
                    attributes: [
                        'id', 'course_id', 'lesson_number', 'title',
                        'description', 'content', 'summary', 'status',
                        'progress_percentage', 'lecture_date', 'duration_minutes',
                        'source_url'
                    ],
                    include: [
                        {
                            model: LearningLessonResource,
                            as: 'resources',
                            attributes: ['id', 'title', 'resource_type', 'url', 'description'],
                            required: false
                        }
                    ]
                });
            }
            break;

        case 'resource':
            if (numId) {
                result = await LearningLessonResource.findByPk(numId);
            }
            break;

        case 'task':
            if (numId) {
                result = await Task.findByPk(numId, {
                    attributes: ['id', 'title', 'status', 'priority', 'due_date', 'description']
                });
            }
            break;

        case 'project':
            if (numId) {
                result = await Project.findByPk(numId, {
                    attributes: ['id', 'name', 'status', 'description', 'category']
                });
            }
            break;

        case 'comment':
            if (numId) {
                result = (await CourseComment.findByPk(numId)) ||
                         (await TaskComment.findByPk(numId)) ||
                         (await LeadComment.findByPk(numId));
            }
            break;

        case 'component':
            result = {
                title: selector?.componentTitle || selector?.title || selector?.pageTitle || 'عنصر مخصص',
                scopeType: 'component',
                scopeId,
                componentTitle: selector?.componentTitle || selector?.title || 'عنصر مخصص',
                componentType: selector?.componentType || 'component',
                pageTitle: selector?.pageTitle || '',
                pageUrl: selector?.pageUrl || '',
                htmlSnapshot: selector?.htmlSnapshot || null,
                metadata: selector || {},
                description: selector?.description || 'محتوى عنصر أو كومبونت مخصص معروض بشكل آمن ومؤقت للقراءة فقط.'
            };
            break;

        case 'page':
        case 'workspace':
        case 'profile_section':
        case 'custom_block':
        default:
            result = {
                title: selector?.title || selector?.pageTitle || `صفحة مشاركة`,
                scopeType,
                scopeId,
                pageTitle: selector?.pageTitle || selector?.title || '',
                pageUrl: selector?.pageUrl || '',
                htmlSnapshot: selector?.htmlSnapshot || null,
                metadata: selector || {},
                description: selector?.description || 'محتوى معروض بشكل آمن ومؤقت للقراءة فقط بدون تسجيل الدخول.'
            };
            break;
    }

    if (result && selector?.htmlSnapshot) {
        if (typeof result.toJSON === 'function') {
            result = result.toJSON();
        }
        result.htmlSnapshot = selector.htmlSnapshot;
        if (selector?.pageTitle && !result.title) {
            result.title = selector.pageTitle;
        }
    }

    return sanitizeSharedEntity(result, scopeType);
}

const serviceExports = {
    ALLOWED_SCOPES,
    resolveScopeEntity
};

export default serviceExports;
