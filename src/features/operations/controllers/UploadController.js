import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getGoogleDriveConfig, uploadBufferToGoogleDrive } from '@/features/settings/services/google-drive.js';
import { requireAuth, ok, badRequest, unauthorized, serverError } from '@/shared/utils/response.js';

const ALLOWED_EXTENSIONS = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico', '.avif', '.bmp',
    '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
    '.zip', '.txt', '.mp4', '.md', '.css', '.json', '.csv'
]);

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/avif',
    'image/bmp',
    'image/x-ms-bmp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'text/css',
    'text/csv',
    'application/json',
    'video/mp4',
    'application/octet-stream'
]);

const MAX_FILE_SIZE = 60 * 1024 * 1024;

function validateMagicBytes(buffer, ext) {
    if (!buffer || buffer.length < 4) return false;
    const hex = buffer.slice(0, 4).toString('hex').toLowerCase();

    if (hex.startsWith('4d5a') || hex.startsWith('7f454c') || hex.startsWith('cafebabe') || hex.startsWith('feedface')) {
        return false;
    }

    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return hex.startsWith('ffd8ff');
        case '.png':
            return hex === '89504e47';
        case '.gif':
            return hex.startsWith('47494638');
        case '.pdf':
            return hex.startsWith('25504446');
        case '.webp':
            return buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP';
        case '.svg': {
            const text = buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trim();
            const lower = text.toLowerCase();
            const isSvg = lower.includes('<svg') || (lower.includes('<?xml') && lower.includes('<svg'));
            const isSafe = !lower.includes('<script') && !lower.includes('javascript:') && !lower.includes('<iframe');
            return isSvg && isSafe;
        }
        case '.ico':
            return hex === '00000100' || hex.startsWith('000001');
        case '.avif':
            return buffer.length >= 12 && buffer.slice(4, 8).toString() === 'ftyp' && (buffer.slice(8, 12).toString().trim().startsWith('avi') || buffer.slice(8, 12).toString() === 'mif1');
        case '.bmp':
            return hex.startsWith('424d');
        case '.zip':
        case '.docx':
        case '.xlsx':
        case '.pptx':
            return hex.startsWith('504b0304') || hex.startsWith('504b0506');
        case '.doc':
        case '.xls':
        case '.ppt':
            return buffer.length >= 8 && buffer.slice(0, 8).toString('hex').toLowerCase().startsWith('d0cf11e0');
        case '.mp4':
            return buffer.length >= 8 && buffer.slice(4, 8).toString() === 'ftyp';
        case '.txt':
        case '.md':
        case '.css':
        case '.json':
        case '.csv':
            return !buffer.slice(0, Math.min(buffer.length, 512)).includes(0x00);
        default:
            return false;
    }
}

export class UploadController {
    static async uploadFile(req) {
        try {
            const user = await requireAuth(req);
            if (!user) {
                return unauthorized('Unauthorized: Authentication required to upload files.');
            }

            const formData = await req.formData();
            const file = formData.get('file');
            const entityType = formData.get('entityType') || 'general';
            const entityName = formData.get('entityName') || formData.get('title') || '';
            const isComment = formData.get('isComment') === 'true' || formData.get('type') === 'comment';

            if (!file || typeof file === 'string') {
                return badRequest('No file uploaded');
            }

            if (file.size > MAX_FILE_SIZE) {
                return badRequest('File size exceeds 15MB limit');
            }

            const ext = path.extname(file.name || '').toLowerCase();
            if (!ALLOWED_EXTENSIONS.has(ext)) {
                return badRequest('File extension not allowed');
            }

            if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
                return badRequest('File MIME type not allowed');
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            if (!validateMagicBytes(buffer, ext)) {
                return badRequest('File contents do not match extension.');
            }

            if (entityName === 'Hero_Video' || (ext === '.mp4' && String(entityName).toLowerCase().includes('video'))) {
                const publicHeroPath = path.join(process.cwd(), 'public', 'backend-hero.mp4');
                await writeFile(publicHeroPath, buffer);
                try {
                    const profileHeroPath = path.resolve(process.cwd(), '..', 'Profile', 'public', 'backend-hero.mp4');
                    await writeFile(profileHeroPath, buffer);
                } catch {}

                return ok({
                    success: true,
                    url: '/backend-hero.mp4',
                    filePath: '/backend-hero.mp4',
                    filename: 'backend-hero.mp4',
                    storage: 'local'
                });
            }

            const rawBase = path.basename(file.name || 'file', ext);
            const safeBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'file';
            const uniqueFilename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}_${safeBase}${ext}`;

            const driveConfig = await getGoogleDriveConfig();
            if (driveConfig.enabled && driveConfig.clientId && driveConfig.clientSecret && driveConfig.refreshToken) {
                try {
                    const driveResult = await uploadBufferToGoogleDrive({
                        buffer,
                        filename: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        entityType,
                        entityName,
                        isComment
                    });

                    const fileUrl = driveResult.directUrl || driveResult.driveUrl;
                    return ok({
                        success: true,
                        url: fileUrl,
                        filePath: fileUrl,
                        driveUrl: driveResult.driveUrl,
                        fileId: driveResult.fileId,
                        filename: driveResult.filename,
                        storage: 'google_drive'
                    });
                } catch (driveErr) {
                    console.error("Google Drive upload failed, falling back to local storage:", driveErr);
                }
            }

            const uploadDir = path.join(process.cwd(), 'storage', 'uploads');
            await mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, uniqueFilename);

            await writeFile(filePath, buffer);

            const localUrl = `/uploads/${encodeURIComponent(uniqueFilename)}`;
            return ok({
                success: true,
                url: localUrl,
                filePath: localUrl,
                filename: uniqueFilename,
                storage: 'local'
            });
        } catch {
            return serverError('Failed to upload file.');
        }
    }
}

export default UploadController;
