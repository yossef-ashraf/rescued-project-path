import { TasksController } from '@/features/tasks/controllers/TasksController.js';

export const todoRoutes = {
  'todo': {
    GET: (req) => TasksController.getTodoItems(req),
    POST: (req) => TasksController.handleTodoAction(req),
    PUT: (req) => TasksController.handleTodoAction(req),
    PATCH: (req) => TasksController.handleTodoAction(req),
    DELETE: (req) => TasksController.handleTodoAction(req)
  },
  'todo/export': {
    GET: (req) => TasksController.exportTodo(req)
  }
};
