import { GoldController } from '@/features/treasury/controllers/GoldController.js';

export const goldRoutes = {
  'gold': {
    GET: (req) => GoldController.getAssets(req),
    POST: (req) => GoldController.createAsset(req),
    PUT: (req) => GoldController.updateAsset(req),
    PATCH: (req) => GoldController.updateAsset(req),
    DELETE: (req) => GoldController.deleteAsset(req)
  },
  'gold-service': {
    GET: (req) => GoldController.getLiveGoldService(req)
  }
};
