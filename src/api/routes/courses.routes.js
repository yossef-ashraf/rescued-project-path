import { CoursesController } from '@/features/learning/controllers/CoursesController.js';

export const coursesRoutes = {
  'courses': {
    GET: (req) => CoursesController.handleGet(req),
    POST: (req) => CoursesController.handlePost(req),
    PUT: (req) => CoursesController.handlePut(req),
    PATCH: (req) => CoursesController.handlePut(req),
    DELETE: (req) => CoursesController.handleDelete(req)
  }
};
