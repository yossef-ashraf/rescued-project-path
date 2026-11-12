import { ProfileController } from '@/features/profile/controllers/ProfileController.js';

export const profileRoutes = {
  'profile': {
    GET: (req) => ProfileController.handleGet(req),
    POST: (req) => ProfileController.handlePost(req),
    PUT: (req) => ProfileController.handlePost(req),
    PATCH: (req) => ProfileController.handlePost(req)
  }
};
