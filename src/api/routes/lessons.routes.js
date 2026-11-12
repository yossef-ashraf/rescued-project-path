import { LessonsController } from '@/features/learning/controllers/LessonsController.js';

export const lessonsRoutes = {
    'learning/lessons': {
        GET: async (req) => {
            const url = new URL(req.url);
            const courseId = url.searchParams.get('courseId') || url.searchParams.get('course_id');
            const search = url.searchParams.get('search');
            const limit = url.searchParams.get('limit');
            const offset = url.searchParams.get('offset');
            return LessonsController.getAllLessons({ courseId, search, limit, offset });
        }
    },

    'learning/courses/:courseId/lessons': {
        GET: async (req, ctx) => {
            const courseId = ctx?.matchedParams?.courseId;
            return LessonsController.getCourseLessons(courseId);
        },
        POST: async (req, ctx) => {
            const courseId = ctx?.matchedParams?.courseId;
            const body = await req.json().catch(() => ({}));
            return LessonsController.createLesson(courseId, body);
        }
    },

    'learning/courses/:courseId/pdf': {
        GET: async (req, ctx) => {
            const courseId = ctx?.matchedParams?.courseId;
            const url = new URL(req.url);
            const lessonId = url.searchParams.get('lessonId') || url.searchParams.get('lesson_id');
            const mode = url.searchParams.get('mode') || 'download';
            const origin = url.origin || 'http://localhost:3000';
            return LessonsController.generateCoursePdf(courseId, { lessonId, mode, origin });
        }
    },

    'learning/lessons/:id': {
        GET: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            return LessonsController.getLesson(id);
        },
        PATCH: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            const body = await req.json().catch(() => ({}));
            return LessonsController.updateLesson(id, body);
        },
        PUT: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            const body = await req.json().catch(() => ({}));
            return LessonsController.updateLesson(id, body);
        },
        DELETE: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            return LessonsController.deleteLesson(id);
        }
    },

    'learning/courses/:courseId/attachments': {
        GET: async (req, ctx) => {
            const courseId = ctx?.matchedParams?.courseId;
            return LessonsController.getCourseAttachments(courseId);
        }
    },

    'learning/lessons/:lessonId/attachments': {
        GET: async (req, ctx) => {
            const lessonId = ctx?.matchedParams?.lessonId;
            return LessonsController.getAttachments(lessonId);
        },
        POST: async (req, ctx) => {
            const lessonId = ctx?.matchedParams?.lessonId;
            const body = await req.json().catch(() => ({}));
            return LessonsController.addAttachment(lessonId, body);
        }
    },

    'learning/attachments/:id': {
        DELETE: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            return LessonsController.deleteAttachment(id);
        }
    },

    'learning/lessons/:lessonId/resources': {
        GET: async (req, ctx) => {
            const lessonId = ctx?.matchedParams?.lessonId;
            return LessonsController.getResources(lessonId);
        },
        POST: async (req, ctx) => {
            const lessonId = ctx?.matchedParams?.lessonId;
            const body = await req.json().catch(() => ({}));
            return LessonsController.addResource(lessonId, body);
        }
    },

    'learning/resources/:id': {
        DELETE: async (req, ctx) => {
            const id = ctx?.matchedParams?.id;
            return LessonsController.deleteResource(id);
        }
    }
};

export default lessonsRoutes;
