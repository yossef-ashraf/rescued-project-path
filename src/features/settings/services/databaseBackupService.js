import { sequelize, Setting, Notification } from '@/shared/models/index.js';
import { getEgyptDateStr, getEgyptTimeStr } from '@/shared/utils/timezone.js';
import {
    getGoogleDriveConfig,
    uploadDatabaseBackupToGoogleDrive,
    cleanupOldDriveDatabaseBackups,
    listDriveDatabaseBackups,
    deleteGoogleDriveFile
} from '@/features/settings/services/google-drive.js';
import { sendTelegramNotification } from '@/features/settings/services/telegram-integration.js';

let isBackupRunning = false;
let lastCompletedSlotInMemory = '';

function formatSqlValue(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (val instanceof Date) return `'${val.toISOString()}'`;
    if (typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
}

export async function generateSqlDatabaseDump() {
    const cairoDate = getEgyptDateStr();
    const cairoTime = getEgyptTimeStr();
    const timestampIso = new Date().toISOString();

    let sqlDump = `-- The-Root Automated SQL Database Backup\n`;
    sqlDump += `-- Generated At (UTC): ${timestampIso}\n`;
    sqlDump += `-- Generated At (Cairo): ${cairoDate} ${cairoTime}\n`;
    sqlDump += `-- Schedule: Twice Daily (04:00 AM Fajr & 06:00 PM Maghrib) | Retention: 2 Days\n\n`;
    sqlDump += `BEGIN;\n\n`;

    const models = Object.values(sequelize.models).filter(m => m.name !== 'AuthOtp');
    let totalRows = 0;
    let tablesExported = 0;
    const tableStats = [];

    const batchSize = 6;
    for (let i = 0; i < models.length; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (model) => {
                try {
                    const rawTable = model.getTableName();
                    const tableName = typeof rawTable === 'string' ? rawTable : rawTable.tableName;
                    const rows = await model.findAll({ raw: true });
                    return { modelName: model.name, tableName, rows, error: null };
                } catch (err) {
                    return { modelName: model.name, tableName: model.name, rows: [], error: err.message };
                }
            })
        );

        for (const item of batchResults) {
            if (item.error) {
                sqlDump += `-- Warning: Error exporting model ${item.modelName}: ${item.error}\n\n`;
                continue;
            }
            const { tableName, rows } = item;
            tableStats.push({ table: tableName, rows: rows.length });
            tablesExported++;

            if (!rows || rows.length === 0) continue;

            totalRows += rows.length;
            sqlDump += `-- Table: ${tableName} (${rows.length} rows)\n`;

            const columns = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');

            for (const row of rows) {
                const values = Object.values(row).map(formatSqlValue).join(', ');
                sqlDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
            }

            sqlDump += `\n`;
        }
    }

    sqlDump += `COMMIT;\n`;

    return {
        sql: sqlDump,
        buffer: Buffer.from(sqlDump, 'utf-8'),
        totalRows,
        tablesExported,
        tableStats,
        cairoDate,
        cairoTime,
        timestampIso
    };
}

async function upsertBackupSetting(key, value) {
    const strVal = value !== undefined && value !== null ? String(value) : '';
    try {
        const [updatedCount] = await Setting.update(
            { value: strVal, category: 'backup' },
            { where: { key } }
        );
        if (updatedCount === 0) {
            await Setting.create({ key, value: strVal, category: 'backup' });
        }
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError' || err?.parent?.code === '23505') {
            await Setting.update(
                { value: strVal, category: 'backup' },
                { where: { key } }
            );
        } else {
            throw err;
        }
    }
}

export async function runDatabaseDriveBackup({
    slotKey = '',
    slotLabel = 'MANUAL',
    retentionDays = 2,
    notifyTelegram = true
} = {}) {
    if (isBackupRunning) {
        return { skipped: true, reason: 'Database backup is already in progress.' };
    }

    isBackupRunning = true;

    try {
        const driveConfig = await getGoogleDriveConfig();
        if (!driveConfig.clientId || !driveConfig.clientSecret || !driveConfig.refreshToken) {
            throw new Error('Google Drive OAuth credentials are not configured in Settings.');
        }

        const dump = await generateSqlDatabaseDump();
        const safeTime = dump.cairoTime.replace(/:/g, '-');
        const cleanSlot = String(slotLabel || 'AUTO').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `codex_db_backup_${dump.cairoDate}_${safeTime}_${cleanSlot}.sql`;

        const uploadResult = await uploadDatabaseBackupToGoogleDrive({
            buffer: dump.buffer,
            filename,
            mimeType: 'application/sql'
        });

        const cleanupResult = await cleanupOldDriveDatabaseBackups({
            retentionDays
        });

        const effectiveSlotKey = slotKey || `${dump.cairoDate}_${safeTime}_${cleanSlot}`;
        lastCompletedSlotInMemory = effectiveSlotKey;

        await Promise.all([
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_AT', dump.timestampIso),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_CAIRO', `${dump.cairoDate} ${dump.cairoTime}`),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_SLOT', effectiveSlotKey),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_FILENAME', uploadResult.filename),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_URL', uploadResult.driveUrl),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_SIZE', uploadResult.sizeFormatted),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_DELETED_COUNT', String(cleanupResult.deletedCount || 0)),
            upsertBackupSetting('LAST_DB_DRIVE_BACKUP_STATUS', 'success')
        ]);

        const notifTitle = `☁️ نسخ احتياطي للداتا بيز على Drive (${slotLabel})`;
        const notifMsg = `تم رفع نسخة الداتا بيز (${uploadResult.filename} - ${uploadResult.sizeFormatted} - ${dump.totalRows} سجل) على Google Drive بنجاح، وتم حذف (${cleanupResult.deletedCount || 0}) نسخة أقدم من يومين.`;

        await Notification.create({
            type: 'db_backup_drive',
            title: notifTitle,
            message: notifMsg,
            link: '/settings?tab=automation',
            is_read: 0,
            created_at: new Date()
        }).catch(() => {});

        if (notifyTelegram) {
            await sendTelegramNotification({
                title: notifTitle,
                message: `${notifMsg}\n\n🔗 الملف: ${uploadResult.driveUrl}`,
                link: '/settings?tab=automation',
                type: 'success',
                priority: 'normal'
            }).catch(() => {});
        }

        return {
            success: true,
            slotKey: effectiveSlotKey,
            slotLabel,
            cairoDate: dump.cairoDate,
            cairoTime: dump.cairoTime,
            tablesExported: dump.tablesExported,
            totalRows: dump.totalRows,
            uploadedFile: uploadResult,
            cleanup: cleanupResult
        };
    } catch (err) {
        await upsertBackupSetting('LAST_DB_DRIVE_BACKUP_STATUS', `error: ${err.message}`).catch(() => {});
        throw err;
    } finally {
        isBackupRunning = false;
    }
}

export async function checkAndRunScheduledDatabaseBackup({ fromCron = false } = {}) {
    const todayCairo = getEgyptDateStr();
    const timeCairo = getEgyptTimeStr();
    const [hourStr] = timeCairo.split(':');
    const cairoHour = parseInt(hourStr, 10);

    let targetSlotKey = null;
    let targetSlotLabel = null;

    // Scheduled daily backups strictly run in Cairo time:
    // 1. Fajr window: 04:00 AM - 05:59 AM Cairo
    // 2. Maghrib window: 18:00 (6:00 PM) - 19:59 (7:59 PM) Cairo
    const isFajrWindow = (cairoHour === 4 || cairoHour === 5);
    const isMaghribWindow = (cairoHour === 18 || cairoHour === 19);

    if (isFajrWindow) {
        targetSlotKey = `${todayCairo}_04_AM`;
        targetSlotLabel = '4AM_FAJR';
    } else if (isMaghribWindow) {
        targetSlotKey = `${todayCairo}_18_PM`;
        targetSlotLabel = '6PM_MAGHRIB';
    }

    if (!targetSlotKey) {
        return { triggered: false, reason: 'Outside 4:00 AM / 6:00 PM backup window (Cairo Time)', cairoHour, timeCairo };
    }

    if (lastCompletedSlotInMemory === targetSlotKey) {
        return { triggered: false, reason: `Slot ${targetSlotKey} already completed in memory` };
    }

    try {
        const lastSlotSetting = await Setting.findOne({
            where: { key: 'LAST_DB_DRIVE_BACKUP_SLOT' },
            raw: true
        });

        if (lastSlotSetting?.value === targetSlotKey) {
            lastCompletedSlotInMemory = targetSlotKey;
            return { triggered: false, reason: `Slot ${targetSlotKey} already completed in DB` };
        }

        const result = await runDatabaseDriveBackup({
            slotKey: targetSlotKey,
            slotLabel: targetSlotLabel,
            retentionDays: 2,
            notifyTelegram: true
        });

        return {
            triggered: true,
            ...result
        };
    } catch (err) {
        console.error('[ScheduledDBBackup Error]:', err?.message);
        return {
            triggered: false,
            error: err?.message || 'Backup failed'
        };
    }
}

export async function getDatabaseBackupStatus() {
    const keys = [
        'LAST_DB_DRIVE_BACKUP_AT',
        'LAST_DB_DRIVE_BACKUP_CAIRO',
        'LAST_DB_DRIVE_BACKUP_SLOT',
        'LAST_DB_DRIVE_BACKUP_FILENAME',
        'LAST_DB_DRIVE_BACKUP_URL',
        'LAST_DB_DRIVE_BACKUP_SIZE',
        'LAST_DB_DRIVE_BACKUP_DELETED_COUNT',
        'LAST_DB_DRIVE_BACKUP_STATUS'
    ];

    const [settingsRows, driveList] = await Promise.all([
        Setting.findAll({
            where: { key: keys },
            raw: true
        }).catch(() => []),
        listDriveDatabaseBackups().catch(err => ({
            configured: false,
            error: err.message,
            files: []
        }))
    ]);

    const meta = {};
    for (const row of settingsRows || []) {
        meta[row.key] = row.value;
    }

    return {
        schedule: {
            times: ['04:00 AM (4 الفجر)', '06:00 PM (6 المغرب)'],
            timezone: 'Africa/Cairo',
            retentionDays: 2,
            retentionHours: 48
        },
        lastBackup: {
            timestampIso: meta.LAST_DB_DRIVE_BACKUP_AT || null,
            cairoDateTime: meta.LAST_DB_DRIVE_BACKUP_CAIRO || null,
            slot: meta.LAST_DB_DRIVE_BACKUP_SLOT || null,
            filename: meta.LAST_DB_DRIVE_BACKUP_FILENAME || null,
            driveUrl: meta.LAST_DB_DRIVE_BACKUP_URL || null,
            size: meta.LAST_DB_DRIVE_BACKUP_SIZE || null,
            deletedOldCount: parseInt(meta.LAST_DB_DRIVE_BACKUP_DELETED_COUNT || '0', 10),
            status: meta.LAST_DB_DRIVE_BACKUP_STATUS || 'idle'
        },
        driveConfigured: Boolean(driveList.configured),
        driveError: driveList.error || null,
        folderId: driveList.folderId || null,
        backups: driveList.files || []
    };
}

export { cleanupOldDriveDatabaseBackups, deleteGoogleDriveFile };
