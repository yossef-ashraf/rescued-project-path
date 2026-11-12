import { ProjectsController } from '@/features/operations/controllers/ProjectsController.js';

export const projectsRoutes = {
  'projects': {
    GET: (req) => ProjectsController.getProjects(req),
    POST: (req) => ProjectsController.createProject(req),
    PUT: (req) => ProjectsController.updateProject(req),
    PATCH: (req) => ProjectsController.updateProject(req),
    DELETE: (req) => ProjectsController.deleteProject(req)
  }
};
