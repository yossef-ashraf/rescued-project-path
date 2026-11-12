import { LeadsController } from '@/features/operations/controllers/LeadsController.js';

export const leadsRoutes = {
  'leads': {
    OPTIONS: () => LeadsController.handleOptions(),
    GET: (req) => LeadsController.getLeads(req),
    POST: (req) => LeadsController.handleAction(req),
    PUT: (req) => LeadsController.handleAction(req),
    PATCH: (req) => LeadsController.handleAction(req),
    DELETE: (req) => LeadsController.deleteLead(req)
  }
};
