import { SettingsController } from '@/features/settings/controllers/SettingsController.js';

export const settingsRoutes = {
  'settings': {
    GET: (req) => SettingsController.getSettings(req),
    POST: (req) => SettingsController.updateSettings(req),
    PUT: (req) => SettingsController.updateSettings(req),
    PATCH: (req) => SettingsController.updateSettings(req)
  }
};
