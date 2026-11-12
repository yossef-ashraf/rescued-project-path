import { AuthController } from '@/features/auth/controllers/AuthController.js';

export const authRoutes = {
  'auth/login': {
    POST: (req) => AuthController.login(req)
  },
  'auth/logout': {
    POST: (req) => AuthController.logout(req)
  },
  'auth/logout-all': {
    POST: (req) => AuthController.logoutAll(req)
  },
  'auth/logs': {
    GET: (req) => AuthController.logs(req)
  },
  'auth/me': {
    GET: (req) => AuthController.me(req)
  },
  'auth/session-event': {
    POST: (req) => AuthController.sessionEvent(req)
  },
  'auth/send-otp': {
    POST: (req) => AuthController.sendOtp(req)
  }
};
