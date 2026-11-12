import { TasksController } from '@/features/tasks/controllers/TasksController.js';

export const tasksRoutes = {
  'tasks': {
    GET: (req) => TasksController.getTasks(req),
    POST: (req) => TasksController.handleTaskAction(req),
    PUT: (req) => TasksController.handleTaskAction(req),
    PATCH: (req) => TasksController.handleTaskAction(req),
    DELETE: (req) => TasksController.deleteTask(req)
  }
};
