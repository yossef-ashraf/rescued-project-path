import {
    Theme,
    UserRole,
    AccountStatus,
    TaskStatus,
    TaskPriority,
    TodoStatus,
    LeadStatus,
    CourseStatus,
    NotificationType,
    NotificationPriority,
    DashboardVerse,
    DASHBOARD_VERSES_LIST
} from '../enums/index.js';

export const THEME = Theme;
export const DASHBOARD_VERSE = DashboardVerse;
export { DASHBOARD_VERSES_LIST };

export const DASHBOARD = Object.freeze({
    MONEY: 'money',
    ME: 'me',
    COURSES: 'courses',
    PROFILE: 'profile',
    SETTINGS: 'settings'
});

export const DRIVE_SYNC_STAGE = Object.freeze({
    IDLE: 'idle',
    UPLOADING: 'uploading',
    SYNCING: 'syncing',
    COMPLETED: 'completed',
    ERROR: 'error'
});

export const USER_ROLE = UserRole;
export const ACCOUNT_STATUS = AccountStatus;
export const OTP_CHANNEL = Object.freeze({ EMAIL: 'email', TELEGRAM: 'telegram', AUTO: 'auto' });

export const AUTH_ACTION = Object.freeze({
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGIN_BLOCKED: 'LOGIN_BLOCKED',
    OTP_LOGIN_SUCCESS: 'OTP_LOGIN_SUCCESS',
    OTP_LOGIN_FAILED: 'OTP_LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REVOKE_SESSIONS: 'REVOKE_USER_SESSIONS',
    GLOBAL_LOGOUT: 'GLOBAL_LOGOUT_ALL_DEVICES',
    OTP_SENT: 'OTP_REQUEST_SENT',
    OTP_FAILED: 'OTP_REQUEST_FAILED',
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    USER_DELETED: 'USER_DELETED'
});

export const AUDIT_STATUS = Object.freeze({
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    WARNING: 'WARNING'
});

export const DEBT_TYPE = Object.freeze({
    OTHER: 0,
    LIABILITY: 1,
    INVESTMENT: 2
});

export const TASK_STATUS = TaskStatus;
export const TASK_PRIORITY = TaskPriority;
export const TODO_STATUS = TodoStatus;
export const LEAD_STATUS = LeadStatus;
export const COURSE_STATUS = CourseStatus;

export const FILE_READ_STATUS = Object.freeze({
    UNREAD: 'unread',
    READING: 'reading',
    COMPLETED: 'completed'
});

export const NOTIFICATION_TYPE = NotificationType;
export const NOTIFICATION_PRIORITY = NotificationPriority;

export const HTTP = Object.freeze({
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
});
export const HttpStatus = HTTP;

export const MSG = Object.freeze({
    UNAUTHORIZED: 'Unauthorized: Authentication required.',
    FORBIDDEN_ADMIN: 'Forbidden: Admin access required.',
    NOT_FOUND: 'Resource not found.',
    MISSING_ID: 'Missing required ID parameter.',
    MISSING_FIELDS: 'Required fields are missing.',
    INVALID_ACTION: 'Invalid action specified.',
    SERVER_ERROR: 'An internal server error occurred.'
});
export const Message = MSG;
