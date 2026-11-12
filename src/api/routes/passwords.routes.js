import { VaultController } from '@/features/settings/controllers/VaultController.js';

export const passwordsRoutes = {
  'passwords': {
    GET: (req) => VaultController.handleGet(req),
    POST: (req) => VaultController.handleAction(req),
    PUT: (req) => VaultController.handleAction(req),
    PATCH: (req) => VaultController.handleAction(req),
    DELETE: (req) => VaultController.handleAction(req)
  }
};
