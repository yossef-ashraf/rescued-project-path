import { AnalyticsController } from '@/features/reports/controllers/AnalyticsController.js';

export const reportsRoutes = {
  'reports/analytics': {
    GET: (req) => AnalyticsController.getAnalytics(req)
  }
};
