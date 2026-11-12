import { authRoutes } from './auth.routes.js';
import { coursesRoutes } from './courses.routes.js';
import { cronRoutes } from './cron.routes.js';
import { exportRoutes } from './export.routes.js';
import { financeRoutes } from './finance.routes.js';
import { goldRoutes } from './gold.routes.js';
import { googleDriveRoutes } from './google-drive.routes.js';
import { leadsRoutes } from './leads.routes.js';
import { mediaDownloadRoutes } from './media-download.routes.js';
import { notesRoutes } from './notes.routes.js';
import { notificationsRoutes } from './notifications.routes.js';
import { passwordsRoutes } from './passwords.routes.js';
import { profileRoutes } from './profile.routes.js';
import { projectsRoutes } from './projects.routes.js';
import { reportsRoutes } from './reports.routes.js';
import { settingsRoutes } from './settings.routes.js';
import { tasksRoutes } from './tasks.routes.js';
import { todoRoutes } from './todo.routes.js';
import { uploadRoutes } from './upload.routes.js';
import { usersRoutes } from './users.routes.js';
import { shareRoutes } from './share.routes.js';
import { lessonsRoutes } from './lessons.routes.js';
import { videoStreamRoutes } from './video-stream.routes.js';

export const routes = {
  ...authRoutes,
  ...coursesRoutes,
  ...cronRoutes,
  ...exportRoutes,
  ...financeRoutes,
  ...goldRoutes,
  ...googleDriveRoutes,
  ...leadsRoutes,
  ...mediaDownloadRoutes,
  ...notesRoutes,
  ...notificationsRoutes,
  ...passwordsRoutes,
  ...profileRoutes,
  ...projectsRoutes,
  ...reportsRoutes,
  ...settingsRoutes,
  ...tasksRoutes,
  ...todoRoutes,
  ...uploadRoutes,
  ...usersRoutes,
  ...shareRoutes,
  ...lessonsRoutes,
  ...videoStreamRoutes
};

export default routes;
