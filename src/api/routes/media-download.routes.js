import { DriveController } from '@/features/settings/controllers/DriveController.js';

export const mediaDownloadRoutes = {
  'media-download': {
    GET: (req) => DriveController.getMediaDownloadList(req)
  }
};
