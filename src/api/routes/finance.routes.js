import { FinanceController } from '@/features/treasury/controllers/FinanceController.js';
import { GoldController } from '@/features/treasury/controllers/GoldController.js';

export const financeRoutes = {
  'finance/backup-db': {
    GET: (req) => FinanceController.backupDatabase(req)
  },
  'finance/credits': {
    GET: (req) => FinanceController.getCredits(req),
    POST: (req) => FinanceController.createCredit(req),
    PUT: (req) => FinanceController.updateCredit(req),
    PATCH: (req) => FinanceController.updateCredit(req),
    DELETE: (req) => FinanceController.deleteCredit(req)
  },
  'finance/debts': {
    GET: (req) => FinanceController.getDebts(req),
    POST: (req) => FinanceController.createDebt(req),
    PUT: (req) => FinanceController.updateDebt(req),
    PATCH: (req) => FinanceController.updateDebt(req),
    DELETE: (req) => FinanceController.deleteDebt(req)
  },
  'finance/export': {
    GET: (req) => FinanceController.exportExcel(req)
  },
  'finance/gold': {
    GET: (req) => GoldController.getAssets(req),
    POST: (req) => GoldController.createAsset(req),
    PUT: (req) => GoldController.updateAsset(req),
    PATCH: (req) => GoldController.updateAsset(req),
    DELETE: (req) => GoldController.deleteAsset(req)
  },
  'finance/months': {
    GET: (req) => FinanceController.getMonths(req),
    POST: (req) => FinanceController.createMonth(req),
    PUT: (req) => FinanceController.updateMonth(req),
    PATCH: (req) => FinanceController.updateMonth(req),
    DELETE: (req) => FinanceController.deleteMonth(req)
  },
  'finance/prices': {
    GET: (req) => FinanceController.getPrices(req),
    POST: (req) => FinanceController.createOrUpdatePrice(req),
    PUT: (req) => FinanceController.updatePrice(req),
    PATCH: (req) => FinanceController.updatePrice(req),
    DELETE: (req) => FinanceController.deletePrice(req)
  },
  'finance/stats': {
    GET: (req) => FinanceController.getStats(req)
  },
  'finance/sync': {
    GET: (req) => FinanceController.sync(req)
  }
};
