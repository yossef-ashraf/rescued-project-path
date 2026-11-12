import { Op } from '@/shared/database/orm.js';
import LearningLesson from '@/shared/models/LearningLesson.js';
import LearningLessonAttachment from '@/shared/models/LearningLessonAttachment.js';
import LearningLessonResource from '@/shared/models/LearningLessonResource.js';
import LearningLessonComment from '@/shared/models/LearningLessonComment.js';
import MaterialKnowledgeLibrary from '@/shared/models/MaterialKnowledgeLibrary.js';
import Course from '@/shared/models/Course.js';
import { successResponse, badRequest, notFound } from '@/shared/api/response';
import { buildCoursePdfHtmlView, renderHtmlViewToPdfBuffer } from '../services/coursePdfView.service.js';

export class LessonsController {
    static async getAllLessons({ courseId, search, limit = 500, offset = 0 } = {}) {
        const whereClause = {};
        if (courseId && courseId !== 'all') {
            whereClause.course_id = Number(courseId);
        }
        if (search && search.trim()) {
            const term = `%${search.trim()}%`;
            whereClause[Op.or] = [
                { title: { [Op.iLike]: term } },
                { description: { [Op.iLike]: term } },
                { summary: { [Op.iLike]: term } }
            ];
        }

        const lessons = await LearningLesson.findAll({
            where: whereClause,
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'category_path', 'presenter_name', 'total_units', 'completed_units', 'progress_percentage'],
                    required: false
                },
                {
                    model: LearningLessonResource,
                    as: 'resources',
                    required: false
                },
                {
                    model: LearningLessonAttachment,
                    as: 'attachments',
                    required: false
                }
            ],
            order: [
                ['course_id', 'ASC'],
                ['sort_order', 'ASC'],
                ['lesson_number', 'ASC'],
                ['id', 'ASC']
            ],
            limit: Math.min(Number(limit) || 500, 1000),
            offset: Number(offset) || 0
        });

        return successResponse(lessons);
    }

    static async getCourseLessons(courseId) {
        if (!courseId) return badRequest('معرف الكورس مطلوب');
        const lessons = await LearningLesson.findAll({
            where: { course_id: courseId },
            include: [
                { model: LearningLessonResource, as: 'resources', required: false },
                { model: LearningLessonAttachment, as: 'attachments', required: false }
            ],
            order: [['sort_order', 'ASC'], ['lesson_number', 'ASC'], ['id', 'ASC']]
        });
        return successResponse(lessons);
    }

    static async createLesson(courseId, payload) {
        if (!courseId) return badRequest('معرف الكورس مطلوب');
        if (!payload.title) return badRequest('عنوان المحاضرة مطلوب');

        // Determine next lesson number if not provided
        let lessonNumber = payload.lesson_number;
        if (!lessonNumber) {
            const count = await LearningLesson.count({ where: { course_id: courseId } });
            lessonNumber = count + 1;
        }

        const lesson = await LearningLesson.create({
            course_id: Number(courseId),
            lesson_number: lessonNumber,
            title: payload.title,
            slug: payload.slug || null,
            description: payload.description || null,
            content: payload.content || '',
            summary: payload.summary || null,
            private_notes: payload.private_notes || null,
            status: payload.status || 'draft',
            progress_percentage: payload.progress_percentage || 0,
            lecture_date: payload.lecture_date || null,
            duration_minutes: payload.duration_minutes || null,
            source_url: payload.source_url || null,
            sort_order: payload.sort_order || lessonNumber
        });

        return successResponse(lesson, 201);
    }

    static async getLesson(lessonId) {
        if (!lessonId) return badRequest('معرف المحاضرة مطلوب');
        const lesson = await LearningLesson.findByPk(lessonId, {
            include: [
                { model: LearningLessonAttachment, as: 'attachments', required: false },
                { model: LearningLessonResource, as: 'resources', required: false },
                { model: Course, as: 'course', attributes: ['id', 'title', 'category_path'], required: false }
            ]
        });
        if (!lesson) return notFound('المحاضرة غير موجودة');

        // Update last opened
        await lesson.update({ last_opened_at: new Date() });

        return successResponse(lesson);
    }

    static async updateLesson(lessonId, payload) {
        if (!lessonId) return badRequest('معرف المحاضرة مطلوب');
        const lesson = await LearningLesson.findByPk(lessonId);
        if (!lesson) return notFound('المحاضرة غير موجودة');

        await lesson.update({
            title: payload.title !== undefined ? payload.title : lesson.title,
            description: payload.description !== undefined ? payload.description : lesson.description,
            content: payload.content !== undefined ? payload.content : lesson.content,
            summary: payload.summary !== undefined ? payload.summary : lesson.summary,
            private_notes: payload.private_notes !== undefined ? payload.private_notes : lesson.private_notes,
            status: payload.status !== undefined ? payload.status : lesson.status,
            progress_percentage: payload.progress_percentage !== undefined ? payload.progress_percentage : lesson.progress_percentage,
            lecture_date: payload.lecture_date !== undefined ? payload.lecture_date : lesson.lecture_date,
            duration_minutes: payload.duration_minutes !== undefined ? payload.duration_minutes : lesson.duration_minutes,
            source_url: payload.source_url !== undefined ? payload.source_url : lesson.source_url,
            sort_order: payload.sort_order !== undefined ? payload.sort_order : lesson.sort_order
        });

        return successResponse(lesson);
    }

    static async deleteLesson(lessonId) {
        if (!lessonId) return badRequest('Lesson ID is required');
        await LearningLessonAttachment.destroy({ where: { lesson_id: lessonId } }).catch(() => {});
        await LearningLessonResource.destroy({ where: { lesson_id: lessonId } }).catch(() => {});
        const deleted = await LearningLesson.destroy({ where: { id: lessonId } });
        if (!deleted) return notFound('Lesson not found');
        return successResponse({ deleted: true, id: lessonId });
    }

    // Attachments
    static async getCourseAttachments(courseId) {
        if (!courseId) return badRequest('معرف الكورس مطلوب');
        const items = await LearningLessonAttachment.findAll({
            include: [{
                model: LearningLesson,
                as: 'lesson',
                where: { course_id: courseId },
                attributes: ['id', 'title', 'lesson_number']
            }],
            order: [['created_at', 'DESC'], ['id', 'DESC']]
        });
        return successResponse(items);
    }

    static async getAttachments(lessonId) {
        const items = await LearningLessonAttachment.findAll({
            where: { lesson_id: lessonId },
            order: [['sort_order', 'ASC'], ['id', 'ASC']]
        });
        return successResponse(items);
    }

    static async addAttachment(lessonId, payload) {
        if (!payload.file_name || !payload.file_url) {
            return badRequest('اسم الملف ورابط الملف مطلوبان');
        }
        const attachment = await LearningLessonAttachment.create({
            lesson_id: Number(lessonId),
            file_name: payload.file_name,
            file_url: payload.file_url,
            file_type: payload.file_type || null,
            file_size: payload.file_size || null,
            storage_provider: payload.storage_provider || 'local',
            description: payload.description || null
        });
        return successResponse(attachment, 201);
    }

    static async deleteAttachment(attachmentId) {
        const deleted = await LearningLessonAttachment.destroy({ where: { id: attachmentId } });
        return successResponse({ deleted: Boolean(deleted), id: attachmentId });
    }

    // Resources
    static async getResources(lessonId) {
        const items = await LearningLessonResource.findAll({
            where: { lesson_id: lessonId },
            order: [['sort_order', 'ASC'], ['id', 'ASC']]
        });
        return successResponse(items);
    }

    static async addResource(lessonId, payload) {
        if (!payload.title) return badRequest('عنوان المصدر مطلوب');
        const resource = await LearningLessonResource.create({
            lesson_id: Number(lessonId),
            title: payload.title,
            resource_type: payload.resource_type || 'link',
            url: payload.url || null,
            description: payload.description || null,
            metadata: payload.metadata || {}
        });
        return successResponse(resource, 201);
    }

    static async deleteResource(resourceId) {
        const deleted = await LearningLessonResource.destroy({ where: { id: resourceId } });
        return successResponse({ deleted: Boolean(deleted), id: resourceId });
    }

    static async generateCoursePdf(courseId, { lessonId = null, mode = 'download', origin = 'http://localhost:3000' } = {}) {
        if (!courseId) return badRequest('معرف الكورس مطلوب');
        const course = await Course.findByPk(courseId);
        if (!course) return notFound('الكورس غير موجود');

        const lessonWhere = { course_id: Number(courseId) };
        if (lessonId && String(lessonId).trim() !== '' && lessonId !== 'all') {
            lessonWhere.id = Number(lessonId);
        }

        const [lessons, courseMaterials, courseComments] = await Promise.all([
            LearningLesson.findAll({
                where: lessonWhere,
                include: [
                    { model: LearningLessonResource, as: 'resources', required: false },
                    { model: LearningLessonAttachment, as: 'attachments', required: false }
                ],
                order: [['lesson_number', 'ASC'], ['sort_order', 'ASC'], ['id', 'ASC']]
            }),
            MaterialKnowledgeLibrary.findAll({
                where: { course_id: Number(courseId) },
                order: [['id', 'ASC']]
            }).catch(() => []),
            LearningLessonComment.findAll({
                where: { course_id: Number(courseId) },
                order: [['created_at', 'ASC'], ['id', 'ASC']]
            }).catch(() => [])
        ]);

        const isSingleLecture = Boolean(lessonId && String(lessonId).trim() !== '' && lessonId !== 'all');
        const html = buildCoursePdfHtmlView({
            course: course.toJSON(),
            lessons: lessons.map((l) => l.toJSON()),
            courseMaterials: courseMaterials.map((m) => m.toJSON()),
            courseComments: courseComments.map((c) => c.toJSON()),
            isSingleLecture,
            origin
        });

        // PDFs are compiled in the browser from this HTML view.
        if (mode === 'html' || mode === 'download' || mode === 'inline') {
            return new Response(html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store'
                }
            });
        }

        const pdfBuffer = await renderHtmlViewToPdfBuffer(html);
        const courseTitleClean = String(course.title || `Course-${courseId}`)
            .replace(/[\\/:*?"<>|]/g, '-')
            .trim();
        const fileName = isSingleLecture
            ? `${courseTitleClean} - محاضرة ${lessons[0]?.lesson_number || 1}.pdf`
            : `${courseTitleClean} - كل المحاضرات.pdf`;

        const asciiFallbackName = isSingleLecture
            ? `course-${courseId}-lecture-${lessons[0]?.lesson_number || 1}.pdf`
            : `course-${courseId}-all-lectures.pdf`;

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': String(pdfBuffer.length),
                'Content-Disposition': `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${asciiFallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
                'X-Export-Filename': encodeURIComponent(fileName),
                'Cache-Control': 'no-store'
            }
        });
    }
}

export default LessonsController;
