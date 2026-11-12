/**
 * Upload Paths & Drive Folder Structure Enum
 * Centralized registry for all entity upload destinations in Google Drive & Local Storage.
 * Edit this file anytime to adjust folder destinations, parent hierarchies, or add new entity types.
 */

export const UploadEntityType = Object.freeze({
    GENERAL: 'general',
    INVESTMENT: 'investment',
    PROFILE: 'profile',
    PROFILE_PHOTO: 'profile_photo',
    BRAND_LOGO: 'brand_logo',
    PROFILE_MEDIA: 'profile_media',
    LEAD: 'lead',
    TASK: 'task',
    MATERIAL: 'material',
    DATABASE_BACKUP: 'database_backup',
    NOTE: 'note'
});

/**
 * Base folder definitions for each entity type in Google Drive.
 * Easily customize folder names and nesting here.
 */
export const UploadDriveFolderConfig = Object.freeze({
    [UploadEntityType.INVESTMENT]: Object.freeze({
        folders: ['General', 'Investments'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.PROFILE]: Object.freeze({
        folders: ['General', 'Profile_Media'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.PROFILE_PHOTO]: Object.freeze({
        folders: ['General', 'Profile_Photo'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.BRAND_LOGO]: Object.freeze({
        folders: ['General', 'Brand_Logo'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.PROFILE_MEDIA]: Object.freeze({
        folders: ['General', 'Profile_Media'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.MATERIAL]: Object.freeze({
        folders: ['General', 'Materials'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.NOTE]: Object.freeze({
        folders: ['General', 'Materials'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.LEAD]: Object.freeze({
        folders: ['Leads'],
        includeEntitySubfolder: true,
        supportsComments: true
    }),
    [UploadEntityType.TASK]: Object.freeze({
        folders: ['Tasks'],
        includeEntitySubfolder: true,
        supportsComments: true
    }),
    [UploadEntityType.DATABASE_BACKUP]: Object.freeze({
        folders: ['Database_Backups'],
        includeEntitySubfolder: false,
        supportsComments: false
    }),
    [UploadEntityType.GENERAL]: Object.freeze({
        folders: ['General'],
        includeEntitySubfolder: true,
        supportsComments: true
    })
});

/**
 * Entity type normalization and alias matching.
 * Maps any common alias/input string to an official UploadEntityType.
 */
export function normalizeUploadEntityType(entityType) {
    if (!entityType || typeof entityType !== 'string') {
        return UploadEntityType.GENERAL;
    }

    const t = entityType.trim().toLowerCase();

    // 1. Investment & Gold Assets
    if (t === 'investment' || t === 'investments' || t === 'gold' || t === 'gold_asset' || t === 'finance' || t.includes('invest') || t.includes('gold')) {
        return UploadEntityType.INVESTMENT;
    }

    // 2. Profile Photo / Avatar
    if (t === 'profile_photo' || t === 'photo' || t === 'avatar' || t === 'user_photo') {
        return UploadEntityType.PROFILE_PHOTO;
    }

    // 3. Brand Logo
    if (t === 'brand_logo' || t === 'logo' || t === 'site_logo') {
        return UploadEntityType.BRAND_LOGO;
    }

    // 4. Profile General
    if (t.includes('profile')) {
        return UploadEntityType.PROFILE;
    }

    // 5. Leads & Clients
    if (t.includes('lead') || t.includes('client')) {
        return UploadEntityType.LEAD;
    }

    // 6. Tasks
    if (t.includes('task') || t.includes('todo')) {
        return UploadEntityType.TASK;
    }

    // 7. Materials, Lessons & Courses
    if (t.includes('material') || t.includes('lesson') || t.includes('course') || t.includes('resource') || t.includes('book')) {
        return UploadEntityType.MATERIAL;
    }

    // 8. Notes & Summaries
    if (t.includes('note') || t.includes('summary')) {
        return UploadEntityType.NOTE;
    }

    // 9. Database Backups
    if (t.includes('backup') || t.includes('database')) {
        return UploadEntityType.DATABASE_BACKUP;
    }

    return UploadEntityType.GENERAL;
}

/**
 * Sanitize folder name for Drive usage.
 */
export function sanitizeDriveFolderName(name) {
    if (!name) return 'General';
    const clean = name.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
    return clean || 'Item_' + Date.now();
}

/**
 * Resolves the ordered folder segments for Google Drive upload.
 * Example outputs:
 *   resolveDriveFolderSegments('investment') => ['General', 'Investments']
 *   resolveDriveFolderSegments('gold') => ['General', 'Investments']
 *   resolveDriveFolderSegments('profile') => ['General', 'Profile_Media']
 *   resolveDriveFolderSegments('lead', { entityName: 'Tharawatseas', isComment: true }) => ['Leads', 'Tharawatseas', 'Comments']
 *
 * @param {string} rawEntityType - The entity type string passed by frontend/controller
 * @param {object} [options]
 * @param {string} [options.entityName] - Specific sub-entity name (e.g. Lead name)
 * @param {boolean} [options.isComment] - Whether the file is an attachment to a comment
 * @returns {string[]} Array of folder names representing the drive path
 */
export function resolveDriveFolderSegments(rawEntityType, { entityName = '', isComment = false } = {}) {
    const entityType = normalizeUploadEntityType(rawEntityType);
    const config = UploadDriveFolderConfig[entityType] || UploadDriveFolderConfig[UploadEntityType.GENERAL];

    const segments = [...config.folders];

    // Entity-specific subfolder (e.g. Leads/{ClientName})
    if (config.includeEntitySubfolder && entityName) {
        segments.push(sanitizeDriveFolderName(entityName));
    }

    // Comment attachment subfolder
    if (config.supportsComments && isComment) {
        segments.push('Comments');
    }

    return segments;
}

/**
 * Returns the resolved path as a human-readable string (e.g. "General / Investments")
 */
export function getDrivePathString(rawEntityType, options = {}) {
    return resolveDriveFolderSegments(rawEntityType, options).join(' / ');
}

const uploadPathExports = {
    UploadEntityType,
    UploadDriveFolderConfig,
    normalizeUploadEntityType,
    resolveDriveFolderSegments,
    getDrivePathString,
    sanitizeDriveFolderName
};

export default uploadPathExports;
