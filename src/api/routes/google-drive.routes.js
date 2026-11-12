import { DriveController } from '@/features/settings/controllers/DriveController.js';

export const googleDriveRoutes = {
  'google-drive/files': {
    GET: (req) => DriveController.listFiles(req)
  }
};
