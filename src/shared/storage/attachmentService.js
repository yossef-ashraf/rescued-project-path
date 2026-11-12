/**
 * Attachment Service
 * Architecture v2
 * Standardizes metadata extraction, mime-type verification, and attachment linking.
 */

export function sanitizeAttachmentMetadata(fileInfo = {}) {
    const fileName = String(fileInfo.fileName || fileInfo.name || 'unnamed_file').trim();
    const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
    const size = Number(fileInfo.size || fileInfo.fileSize || 0);
    const mimeType = String(fileInfo.mimeType || fileInfo.type || 'application/octet-stream').toLowerCase();

    return {
        fileName,
        extension: ext,
        size,
        mimeType,
        storageKey: fileInfo.storageKey || `uploads/${Date.now()}_${fileName}`,
        entityType: fileInfo.entityType || 'general', // 'course', 'lesson', 'task', 'project', 'lead', 'profile'
        entityId: fileInfo.entityId ? Number(fileInfo.entityId) : null,
        ownerId: fileInfo.ownerId ? Number(fileInfo.ownerId) : null,
        createdAt: new Date().toISOString()
    };
}

export function validateAttachment(metadata = {}, { maxSizeBytes = 25 * 1024 * 1024, allowedExtensions = [] } = {}) {
    if (!metadata.fileName) {
        return { valid: false, error: 'اسم الملف غير صالح' };
    }

    if (metadata.size > maxSizeBytes) {
        const mb = Math.round(maxSizeBytes / (1024 * 1024));
        return { valid: false, error: `حجم الملف يتجاوز الحد المسموح به (${mb}MB)` };
    }

    if (allowedExtensions.length > 0 && !allowedExtensions.includes(metadata.extension)) {
        return { valid: false, error: `صيغة الملف غير مدعومة: .${metadata.extension}` };
    }

    return { valid: true };
}

const serviceExports = {
    sanitizeAttachmentMetadata,
    validateAttachment
};

export default serviceExports;
