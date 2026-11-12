import path from 'path';
import { Op } from '@/shared/database/orm.js';
import { GoldAsset, TaskAttachment, MaterialKnowledgeLibrary } from '@/shared/models/index.js';
import { getGoogleDriveConfig, listGoogleDriveFiles } from '@/features/settings/services/google-drive.js';
import { requireAuth, ok, unauthorized, serverError } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';

const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf', '.svg', '.webp', '.gif', '.zip', '.txt', '.doc', '.docx', '.md', '.css'];

// Lists files uploaded to the private Lovable Cloud "uploads" bucket (served at /uploads/<name>).
async function scanCloudUploads(filesMap) {
    try {
        const { getDbClient } = await import('@/shared/database/db-context.server.js');
        const bucket = getDbClient().storage.from('uploads');
        for (let offset = 0; offset < 10000; offset += 1000) {
            const { data, error } = await bucket.list('', { limit: 1000, offset, sortBy: { column: 'created_at', order: 'desc' } });
            if (error || !data?.length) break;
            for (const entry of data) {
                if (!entry?.name || entry.id === null) continue;
                const ext = path.extname(entry.name).toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext) && ext !== '.mp4') continue;
                const webPath = `/uploads/${entry.name}`;
                const size = Number(entry.metadata?.size || 0);
                filesMap.set(webPath, { name: entry.name, path: webPath, source: 'uploads', size: `${(size / 1024).toFixed(1)} KB` });
            }
            if (data.length < 1000) break;
        }
    } catch {
    }
}

export class DriveController {
    static async listFiles(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const config = await getGoogleDriveConfig();
            if (!config.enabled) {
                return ok({
                    configured: Boolean(config.clientId && config.clientSecret && config.refreshToken),
                    enabled: false,
                    files: [],
                    message: "Google Drive is disabled in settings."
                });
            }

            if (!config.clientId || !config.clientSecret || !config.refreshToken) {
                return ok({
                    configured: false,
                    enabled: true,
                    files: [],
                    message: "Google Drive credentials not set yet."
                });
            }

            try {
                const files = await listGoogleDriveFiles();
                return ok({
                    configured: true,
                    enabled: true,
                    connected: true,
                    files
                });
            } catch (driveErr) {
                console.warn('[Google Drive Connection Warning]:', driveErr.message);
                return ok({
                    configured: true,
                    enabled: true,
                    connected: false,
                    files: [],
                    warning: driveErr.message || 'Unable to connect to Google Drive.'
                });
            }
        } catch (err) {
            return apiError(err);
        }
    }

    static async getMediaDownloadList(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized('Unauthorized: Authentication required.');

            const filesMap = new Map();
            await scanCloudUploads(filesMap);

            try {
                const driveConfig = await getGoogleDriveConfig();
                if (driveConfig.enabled && driveConfig.clientId && driveConfig.clientSecret && driveConfig.refreshToken) {
                    const driveFiles = await listGoogleDriveFiles();
                    for (const df of driveFiles) {
                        filesMap.set(`gdrive-${df.id}`, {
                            name: df.name,
                            path: df.driveUrl || df.thumbnailUrl,
                            source: 'Google Drive',
                            size: df.size || 'N/A'
                        });
                    }
                }
            } catch (driveErr) {
                console.warn("Could not list Google Drive files for media download:", driveErr.message);
            }

            try {
                const invRows = await GoldAsset.findAll({
                    attributes: ['name', 'image'],
                    where: {
                        image: {
                            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
                        }
                    },
                    raw: true
                });

                for (const r of invRows) {
                    if (r.image) {
                        let cleanPath = r.image.trim();
                        if (!cleanPath.startsWith('/') && !cleanPath.startsWith('http')) {
                            cleanPath = `/${cleanPath}`;
                        }
                        if (!filesMap.has(cleanPath)) {
                            const fileName = cleanPath.startsWith('http') ? (r.name || 'Drive Image') : path.basename(cleanPath);
                            filesMap.set(cleanPath, {
                                name: fileName || r.name || 'Investment File',
                                path: cleanPath,
                                source: cleanPath.startsWith('http') ? 'Google Drive' : 'Investment Media',
                                size: 'N/A'
                            });
                        }
                    }
                }
            } catch {
            }

            try {
                const taskAtts = await TaskAttachment.findAll({
                    attributes: ['file_name', 'file_path', 'file_size', 'file_type'],
                    raw: true
                });

                for (const att of taskAtts) {
                    if (att.file_path) {
                        let cleanPath = att.file_path.trim();
                        if (!cleanPath.startsWith('/') && !cleanPath.startsWith('http')) cleanPath = `/${cleanPath}`;

                        if (!filesMap.has(cleanPath)) {
                            filesMap.set(cleanPath, {
                                name: att.file_name || 'Task Attachment',
                                path: cleanPath,
                                source: cleanPath.startsWith('http') ? 'Google Drive' : 'Task Attachment',
                                size: att.file_size ? `${att.file_size} KB` : 'N/A'
                            });
                        }
                    }
                }
            } catch {
            }

            try {
                const notesAtts = await MaterialKnowledgeLibrary.findAll({
                    attributes: ['file_name', 'file_url'],
                    where: {
                        item_type: 'summary',
                        file_url: {
                            [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
                        }
                    },
                    raw: true
                });

                for (const n of notesAtts) {
                    if (n.file_url) {
                        let cleanPath = n.file_url.trim();
                        if (!cleanPath.startsWith('/') && !cleanPath.startsWith('http')) cleanPath = `/${cleanPath}`;

                        if (!filesMap.has(cleanPath)) {
                            filesMap.set(cleanPath, {
                                name: n.file_name || 'Note File',
                                path: cleanPath,
                                source: cleanPath.startsWith('http') ? 'Google Drive' : 'Personal Note',
                                size: 'N/A'
                            });
                        }
                    }
                }
            } catch {
            }

            const filesList = Array.from(filesMap.values());

            return ok({
                count: filesList.length,
                files: filesList
            });
        } catch (err) {
            return serverError(err);
        }
    }
}

export default DriveController;
