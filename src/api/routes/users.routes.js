import { UsersController } from '@/features/settings/controllers/UsersController.js';

export const usersRoutes = {
  'users': {
    GET: (req) => UsersController.getUsers(req),
    POST: (req) => UsersController.createUser(req),
    PUT: (req) => UsersController.updateUser(req),
    PATCH: (req) => UsersController.updateUser(req),
    DELETE: (req) => UsersController.deleteUser(req)
  }
};
