export const SystemSettingsSchema = {
    theme: { type: 'string', enum: ['light', 'dark', 'system'], default: 'system' },
    notificationsEnabled: { type: 'boolean', default: true }
};
