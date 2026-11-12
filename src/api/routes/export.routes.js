import { ExportController } from '@/features/settings/controllers/ExportController.js';

export const exportRoutes = {
  'export': {
    GET: (req) => ExportController.exportModule(req)
  },
  'export-db': {
    GET: (req) => ExportController.exportDatabase(req)
  },
  'backup/drive': {
    GET: (req) => ExportController.handleDriveBackup(req),
    POST: (req) => ExportController.handleDriveBackup(req)
  }
};
