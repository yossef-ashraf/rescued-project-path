import { UploadController } from '@/features/operations/controllers/UploadController.js';

export const uploadRoutes = {
  'upload': {
    POST: (req) => UploadController.uploadFile(req)
  }
};
