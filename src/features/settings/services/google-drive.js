import { Setting } from '@/shared/models/index.js';
import { Op } from '@/shared/database/orm.js';
import { resolveDriveFolderSegments } from '@/shared/enums/upload-paths.enum.js';

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } catch (err) {
        if (err.name === 'AbortError' || err.code === 'UND_ERR_CONNECT_TIMEOUT' || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
            throw new Error(`Google API request timed out after ${timeoutMs}ms.`);
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

export async function getGoogleDriveConfig() {
    const config = {
        clientId: (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim(),
        clientSecret: (process.env.GOOGLE_DRIVE_CLIENT_SECRET || '').trim(),
        refreshToken: (process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '').trim(),
        folderId: (process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim(),
        enabled: process.env.ENABLE_GOOGLE_DRIVE === 'true' || process.env.ENABLE_GOOGLE_DRIVE === '1'
    };

    try {
        const rows = await Setting.findAll({
            attributes: ['key', 'value'],
            where: {
                [Op.or]: [
                    { category: 'google_drive' },
                    { key: { [Op.like]: 'GOOGLE_%' } },
                    { key: 'ENABLE_GOOGLE_DRIVE' }
                ]
            },
            raw: true
        });

        if (rows && rows.length > 0) {
            rows.forEach(r => {
                if (r.key === 'GOOGLE_DRIVE_CLIENT_ID' && r.value) config.clientId = r.value.trim();
                if (r.key === 'GOOGLE_DRIVE_CLIENT_SECRET' && r.value) config.clientSecret = r.value.trim();
                if (r.key === 'GOOGLE_DRIVE_REFRESH_TOKEN' && r.value) config.refreshToken = r.value.trim();
                if (r.key === 'GOOGLE_DRIVE_FOLDER_ID' && r.value) config.folderId = r.value.trim();
                if (r.key === 'ENABLE_GOOGLE_DRIVE') config.enabled = r.value === 'true' || r.value === '1';
            });
        }

        if (config.clientId && config.clientSecret && config.refreshToken && !rows?.some(r => r.key === 'ENABLE_GOOGLE_DRIVE')) {
            config.enabled = true;
        }

        return config;
    } catch {
        return config;
    }
}

export async function getGoogleAccessToken(config) {
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw new Error('Google Drive is missing Client ID, Client Secret, or Refresh Token.');
    }

    const res = await fetchWithTimeout('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: config.refreshToken,
            grant_type: 'refresh_token'
        })
    }, 30000);

    const data = await res.json();
    if (!res.ok || !data.access_token) {
        throw new Error(`Google OAuth token exchange failed: ${data.error_description || data.error || JSON.stringify(data)}`);
    }

    return data.access_token;
}

function sanitizeFolderName(name) {
    if (!name) return 'General';
    let clean = name.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
    return clean || 'Item_' + Date.now();
}

export async function getOrCreateGoogleDriveFolder({ folderName, parentFolderId, accessToken }) {
    const targetParentId = parentFolderId || 'root';
    const cleanName = folderName || 'General';

    const safeName = String(cleanName).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const safeParentId = String(targetParentId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const q = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and '${safeParentId}' in parents and trashed=false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const searchRes = await fetchWithTimeout(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }, 30000);

    const searchData = await searchRes.json();
    if (searchRes.ok && searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    }

    const createRes = await fetchWithTimeout('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: cleanName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [targetParentId]
        })
    }, 30000);

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
        throw new Error(`Failed to create Google Drive folder '${cleanName}': ${JSON.stringify(createData)}`);
    }

    return createData.id;
}

export async function uploadBufferToGoogleDrive({ buffer, filename, mimeType, entityType = 'general', entityName = '', isComment = false }) {
    const config = await getGoogleDriveConfig();
    const accessToken = await getGoogleAccessToken(config);

    let currentParentId = config.folderId;
    if (!currentParentId) {
        throw new Error('Google Drive folder ID is not configured in database settings.');
    }

    const folderSegments = resolveDriveFolderSegments(entityType, { entityName, isComment });
    for (const folderName of folderSegments) {
        currentParentId = await getOrCreateGoogleDriveFolder({
            folderName,
            parentFolderId: currentParentId,
            accessToken
        });
    }

    const randomTag = Math.random().toString(36).substring(2, 6);
    const timePrefix = Date.now();
    const cleanFilename = filename ? filename.replace(/\s+/g, '_') : 'file.bin';
    const uniqueFilename = `${timePrefix}_${randomTag}_${cleanFilename}`;

    const metadata = {
        name: uniqueFilename,
        mimeType: mimeType || 'application/octet-stream',
        parents: [currentParentId]
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataHeader = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata);

    const mediaHeader = delimiter +
        `Content-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`;

    const bodyBuffer = Buffer.concat([
        Buffer.from(metadataHeader),
        Buffer.from(mediaHeader),
        buffer,
        Buffer.from(closeDelimiter)
    ]);

    const res = await fetchWithTimeout('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length.toString()
        },
        body: bodyBuffer
    }, 20000);

    const fileData = await res.json();
    if (!res.ok || !fileData.id) {
        throw new Error(`Google Drive upload failed: ${JSON.stringify(fileData)}`);
    }

    try {
        await fetchWithTimeout(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone'
            })
        }, 5000);
    } catch (permErr) {
        console.warn('Could not set Google Drive file permissions to public:', permErr);
    }

    const fileId = fileData.id;
    const isVideo = (mimeType || '').startsWith('video/') || (uniqueFilename || '').match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i);
    const directUrl = isVideo ? `https://drive.usercontent.google.com/download?id=${fileId}` : `https://lh3.googleusercontent.com/d/${fileId}`;
    const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;

    return {
        fileId,
        filename: uniqueFilename,
        driveUrl,
        directUrl,
        webViewLink: driveUrl
    };
}

export async function uploadDatabaseBackupToGoogleDrive({ buffer, filename, mimeType = 'application/sql' }) {
    const config = await getGoogleDriveConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        throw new Error('Google Drive credentials (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN) are not configured.');
    }

    const accessToken = await getGoogleAccessToken(config);
    const rootParentId = config.folderId || 'root';

    const backupFolderId = await getOrCreateGoogleDriveFolder({
        folderName: 'Database_Backups',
        parentFolderId: rootParentId,
        accessToken
    });

    const cleanFilename = (filename || `codex_db_backup_${Date.now()}.sql`).replace(/\s+/g, '_');

    const metadata = {
        name: cleanFilename,
        mimeType: mimeType || 'application/sql',
        parents: [backupFolderId],
        description: 'The-Root Automated Database Backup (2-Day Retention)'
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataHeader = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata);

    const mediaHeader = delimiter +
        `Content-Type: ${mimeType || 'application/sql'}\r\n\r\n`;

    const payloadBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer), 'utf-8');

    const bodyBuffer = Buffer.concat([
        Buffer.from(metadataHeader),
        Buffer.from(mediaHeader),
        payloadBuffer,
        Buffer.from(closeDelimiter)
    ]);

    const res = await fetchWithTimeout('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length.toString()
        },
        body: bodyBuffer
    }, 120000);

    const fileData = await res.json();
    if (!res.ok || !fileData.id) {
        throw new Error(`Google Drive DB backup upload failed: ${JSON.stringify(fileData)}`);
    }

    const fileId = fileData.id;
    const driveUrl = fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const downloadUrl = fileData.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
        fileId,
        filename: cleanFilename,
        folderId: backupFolderId,
        sizeBytes: payloadBuffer.length,
        sizeFormatted: `${(payloadBuffer.length / 1024).toFixed(1)} KB`,
        createdTime: fileData.createdTime || new Date().toISOString(),
        driveUrl,
        downloadUrl
    };
}

export async function deleteGoogleDriveFile(fileId, providedAccessToken = null) {
    if (!fileId) throw new Error('File ID is required to delete from Google Drive.');
    let accessToken = providedAccessToken;
    if (!accessToken) {
        const config = await getGoogleDriveConfig();
        accessToken = await getGoogleAccessToken(config);
    }

    const res = await fetchWithTimeout(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }, 30000);

    if (!res.ok && res.status !== 204 && res.status !== 404) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Failed to delete Google Drive file ${fileId}: ${res.status} ${errText}`);
    }

    return { deleted: true, fileId };
}

export async function listDriveDatabaseBackups() {
    const config = await getGoogleDriveConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        return { configured: false, files: [] };
    }

    const accessToken = await getGoogleAccessToken(config);
    const rootParentId = config.folderId || 'root';

    const backupFolderId = await getOrCreateGoogleDriveFolder({
        folderName: 'Database_Backups',
        parentFolderId: rootParentId,
        accessToken
    });

    const safeFolderId = String(backupFolderId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const q = `'${safeFolderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,createdTime,webViewLink,webContentLink)&pageSize=100&orderBy=createdTime desc`;

    const res = await fetchWithTimeout(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }, 30000);

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to list Google Drive database backups');
    }

    const nowMs = Date.now();
    const files = (data.files || []).map(f => {
        const createdMs = f.createdTime ? new Date(f.createdTime).getTime() : nowMs;
        const ageHours = Math.max(0, Math.round(((nowMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);
        const sizeNum = parseInt(f.size || '0', 10);
        const sizeLabel = sizeNum >= 1024 * 1024
            ? `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.max(1, Math.round(sizeNum / 1024))} KB`;

        return {
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            sizeBytes: sizeNum,
            size: sizeLabel,
            createdTime: f.createdTime,
            ageHours,
            isExpired: ageHours >= 48,
            driveUrl: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
            downloadUrl: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`
        };
    });

    return {
        configured: true,
        folderId: backupFolderId,
        files
    };
}

export async function cleanupOldDriveDatabaseBackups({ retentionDays = 2 } = {}) {
    const config = await getGoogleDriveConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
        return { configured: false, deletedCount: 0, deletedFiles: [], remainingCount: 0 };
    }

    const accessToken = await getGoogleAccessToken(config);
    const { files } = await listDriveDatabaseBackups();

    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    const cutoffMs = Date.now() - retentionMs;

    const expiredFiles = (files || []).filter(file => {
        if (!file.createdTime) return false;
        const fileTimeMs = new Date(file.createdTime).getTime();
        return !Number.isNaN(fileTimeMs) && fileTimeMs < cutoffMs;
    });

    const deletedFiles = [];
    const failedFiles = [];

    for (const file of expiredFiles) {
        try {
            await deleteGoogleDriveFile(file.id, accessToken);
            deletedFiles.push({
                id: file.id,
                name: file.name,
                createdTime: file.createdTime,
                ageHours: file.ageHours
            });
        } catch (err) {
            failedFiles.push({
                id: file.id,
                name: file.name,
                error: err.message
            });
        }
    }

    return {
        configured: true,
        retentionDays,
        cutoffIso: new Date(cutoffMs).toISOString(),
        deletedCount: deletedFiles.length,
        deletedFiles,
        failedFiles,
        remainingCount: Math.max(0, (files || []).length - deletedFiles.length)
    };
}

export async function listGoogleDriveFiles() {
    const config = await getGoogleDriveConfig();
    if (!config.enabled) {
        return [];
    }
    const accessToken = await getGoogleAccessToken(config);

    let queryParam = `trashed=false and mimeType != 'application/vnd.google-apps.folder'`;

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryParam)}&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink)&pageSize=100&orderBy=createdTime desc`;

    const res = await fetchWithTimeout(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }, 30000);

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to list Google Drive files');
    }

    return (data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
        createdTime: f.createdTime,
        thumbnailUrl: `https://lh3.googleusercontent.com/d/${f.id}`,
        driveUrl: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        downloadUrl: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`
    }));
}

