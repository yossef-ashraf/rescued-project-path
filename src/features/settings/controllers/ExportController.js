import { Op } from '@/shared/database/orm.js';
import {
    TodoItem,
    Debt,
    Credit,
    Course,
    CourseFile,
    sequelize
} from '@/shared/models/index.js';
import { requireAuth, ok, badRequest, unauthorized, serverError } from '@/shared/utils/response.js';
import {
    runDatabaseDriveBackup,
    cleanupOldDriveDatabaseBackups,
    getDatabaseBackupStatus,
    deleteGoogleDriveFile
} from '@/features/settings/services/databaseBackupService.js';

function jsonToCsv(items, fields) {
    if (!items || !items.length) {
        return fields.map(f => `"${f.label.replace(/"/g, '""')}"`).join(',') + '\n';
    }

    const header = fields.map(f => `"${f.label.replace(/"/g, '""')}"`).join(',');
    const rows = items.map(item => {
        return fields.map(f => {
            let val = item[f.key];
            if (val === null || val === undefined) val = '';
            if (val instanceof Date) val = val.toISOString();
            if (typeof val === 'object') val = JSON.stringify(val);
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
        }).join(',');
    });

    return '\uFEFF' + [header, ...rows].join('\n');
}

export class ExportController {
    static async exportModule(req) {
        try {
            const user = await requireAuth(req);
            if (!user) {
                return unauthorized('Unauthorized: Authentication required.');
            }

            const { searchParams } = new URL(req.url);
            const moduleType = searchParams.get('module') || searchParams.get('type') || 'all';
            const format = (searchParams.get('format') || 'csv').toLowerCase();
            const year = searchParams.get('year') || '';
            const month = searchParams.get('month') || '';

            if (moduleType === 'todo' || moduleType === 'tasks' || moduleType === 'all') {
                const whereClause = {};
                if (year) {
                    const yr = parseInt(year, 10);
                    whereClause[Op.and] = [
                        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "created_at"')), yr)
                    ];
                }

                const todoItems = await TodoItem.findAll({
                    attributes: ['id', 'text', 'description', 'done', 'due_date', 'reminder_time', 'created_at', 'updated_at', 'duration_hours'],
                    where: Object.keys(whereClause).length ? whereClause : undefined,
                    order: [['created_at', 'DESC']],
                    raw: true
                });

                if (moduleType === 'todo' || moduleType === 'tasks') {
                    const fields = [
                        { key: 'id', label: 'ID' },
                        { key: 'text', label: 'Task Title / عنوان المهمة' },
                        { key: 'description', label: 'Description / الوصف' },
                        { key: 'done', label: 'Status (Done) / منجز' },
                        { key: 'due_date', label: 'Due Date / تاريخ الاستحقاق' },
                        { key: 'reminder_time', label: 'Reminder / التذكير' },
                        { key: 'created_at', label: 'Created At / تاريخ الإنشاء' },
                        { key: 'updated_at', label: 'Updated At / تاريخ التحديث' }
                    ];

                    if (format === 'csv') {
                        const csv = jsonToCsv(todoItems, fields);
                        return new Response(csv, {
                            headers: {
                                'Content-Type': 'text/csv; charset=utf-8',
                                'Content-Disposition': `attachment; filename="codex_todo_${year || 'all'}_${Date.now()}.csv"`
                            }
                        });
                    }

                    return new Response(JSON.stringify(todoItems, null, 2), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="codex_todo_${year || 'all'}_${Date.now()}.json"`
                        }
                    });
                }
            }

            if (moduleType === 'finance' || moduleType === 'debts' || moduleType === 'credits') {
                const financeWhere = {};
                if (year) financeWhere.year = parseInt(year, 10);
                if (month) {
                    // Months are stored as numbers (1-12); accept a number or an English month name.
                    const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
                    const raw = String(month).trim().toLowerCase();
                    const idx = /^\d+$/.test(raw) ? parseInt(raw, 10) : MONTHS.findIndex((m) => m.startsWith(raw.slice(0, 3))) + 1;
                    if (idx >= 1 && idx <= 12) financeWhere.month = idx;
                }

                const [debts, credits] = await Promise.all([
                    Debt.findAll({
                        where: Object.keys(financeWhere).length ? financeWhere : undefined,
                        order: [['year', 'DESC'], ['month_id', 'DESC'], ['id', 'DESC']],
                        raw: true
                    }),
                    Credit.findAll({
                        where: Object.keys(financeWhere).length ? financeWhere : undefined,
                        order: [['year', 'DESC'], ['month_id', 'DESC'], ['id', 'DESC']],
                        raw: true
                    })
                ]);

                const mergedFinance = [
                    ...credits.map(c => ({
                        id: c.id,
                        transaction_type: 'CREDIT (إيداع / دخل)',
                        name: c.name,
                        amount: c.amount,
                        type_label: c.type === 1 ? 'Salary' : 'Extra',
                        month: c.month,
                        year: c.year,
                        week: c.week,
                        note: c.note || '',
                        date: c.created_at
                    })),
                    ...debts.map(d => ({
                        id: d.id,
                        transaction_type: 'DEBT (مصروف / التزام)',
                        name: d.name,
                        amount: d.amount,
                        type_label: d.type === 1 ? 'Liability' : (d.type === 2 ? 'Investment' : 'Other'),
                        month: d.month,
                        year: d.year,
                        week: d.week,
                        note: d.note || '',
                        date: d.created_at
                    }))
                ];

                const fields = [
                    { key: 'id', label: 'ID' },
                    { key: 'transaction_type', label: 'Operation / نوع المعاملة' },
                    { key: 'name', label: 'Item Name / الاسم والوصف' },
                    { key: 'amount', label: 'Amount (EGP) / المبلغ' },
                    { key: 'type_label', label: 'Category / التصنيف' },
                    { key: 'month', label: 'Month / الشهر' },
                    { key: 'year', label: 'Year / السنة' },
                    { key: 'week', label: 'Week / الأسبوع' },
                    { key: 'note', label: 'Notes / ملاحظات' },
                    { key: 'date', label: 'Date / التاريخ' }
                ];

                if (format === 'csv') {
                    const csv = jsonToCsv(mergedFinance, fields);
                    return new Response(csv, {
                        headers: {
                            'Content-Type': 'text/csv; charset=utf-8',
                            'Content-Disposition': `attachment; filename="codex_finance_${year || 'all'}_${Date.now()}.csv"`
                        }
                    });
                }

                return new Response(JSON.stringify({ debts, credits, merged: mergedFinance }, null, 2), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Disposition': `attachment; filename="codex_finance_${year || 'all'}_${Date.now()}.json"`
                    }
                });
            }

            if (moduleType === 'courses' || moduleType === 'materials') {
                const [courses, materials] = await Promise.all([
                    Course.findAll({
                        attributes: ['id', 'title', 'category_path', 'resource_type', 'total_units', 'completed_units', 'progress_percentage', 'status', 'created_at'],
                        order: [['id', 'DESC']],
                        raw: true
                    }),
                    CourseFile.findAll({
                        attributes: ['id', 'file_name', 'file_type', 'category_name', 'reading_status', 'notes', 'created_at'],
                        order: [['id', 'DESC']],
                        raw: true
                    })
                ]);

                if (moduleType === 'courses') {
                    const fields = [
                        { key: 'id', label: 'ID' },
                        { key: 'title', label: 'Course Title / اسم الدورة' },
                        { key: 'category_path', label: 'Category / التصنيف' },
                        { key: 'resource_type', label: 'Type / النوع' },
                        { key: 'total_units', label: 'Total Videos / إجمالي الفيديوهات' },
                        { key: 'completed_units', label: 'Completed / المنجز' },
                        { key: 'progress_percentage', label: 'Progress % / نسبة التقدم' },
                        { key: 'status', label: 'Status / الحالة' },
                        { key: 'created_at', label: 'Created At / تاريخ الإنشاء' }
                    ];

                    if (format === 'csv') {
                        const csv = jsonToCsv(courses, fields);
                        return new Response(csv, {
                            headers: {
                                'Content-Type': 'text/csv; charset=utf-8',
                                'Content-Disposition': `attachment; filename="codex_courses_${Date.now()}.csv"`
                            }
                        });
                    }

                    return new Response(JSON.stringify(courses, null, 2), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="codex_courses_${Date.now()}.json"`
                        }
                    });
                }

                if (moduleType === 'materials') {
                    const fields = [
                        { key: 'id', label: 'ID' },
                        { key: 'file_name', label: 'Material Name / اسم المادة' },
                        { key: 'category_name', label: 'Category / التصنيف' },
                        { key: 'file_type', label: 'Type / النوع' },
                        { key: 'reading_status', label: 'Status / الحالة' },
                        { key: 'notes', label: 'Notes / الملاحظات' },
                        { key: 'created_at', label: 'Created At / تاريخ الإنشاء' }
                    ];

                    if (format === 'csv') {
                        const csv = jsonToCsv(materials, fields);
                        return new Response(csv, {
                            headers: {
                                'Content-Type': 'text/csv; charset=utf-8',
                                'Content-Disposition': `attachment; filename="codex_materials_${Date.now()}.csv"`
                            }
                        });
                    }

                    return new Response(JSON.stringify(materials, null, 2), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Disposition': `attachment; filename="codex_materials_${Date.now()}.json"`
                        }
                    });
                }
            }

            const [allTodos, allDebts, allCredits, allCourses, allMaterials] = await Promise.all([
                TodoItem.findAll({ order: [['id', 'DESC']], raw: true }),
                Debt.findAll({ order: [['id', 'DESC']], raw: true }),
                Credit.findAll({ order: [['id', 'DESC']], raw: true }),
                Course.findAll({ order: [['id', 'DESC']], raw: true }),
                CourseFile.findAll({ order: [['id', 'DESC']], raw: true })
            ]);

            const fullExport = {
                export_timestamp: new Date().toISOString(),
                platform: 'Codex Dashboard',
                counts: {
                    todos: allTodos.length,
                    debts: allDebts.length,
                    credits: allCredits.length,
                    courses: allCourses.length,
                    materials: allMaterials.length
                },
                data: {
                    todos: allTodos,
                    debts: allDebts,
                    credits: allCredits,
                    courses: allCourses,
                    materials: allMaterials
                }
            };

            return new Response(JSON.stringify(fullExport, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="codex_complete_backup_${Date.now()}.json"`
                }
            });
        } catch (err) {
            console.error('Export API error:', err);
            return serverError(err);
        }
    }

    static async exportDatabase(request) {
        try {
            const user = await requireAuth(request);
            if (!user) {
                return unauthorized('Unauthorized: Authentication required.');
            }

            const models = Object.values(sequelize.models).filter(m => m.name !== 'AuthOtp');

            let sqlDump = `-- ==========================================\n`;
            sqlDump += `-- Codex-Me Database Backup\n`;
            sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
            sqlDump += `-- Total Tables: ${models.length}\n`;
            sqlDump += `-- ==========================================\n\n`;

            for (const model of models) {
                try {
                    const table = model.tableName;
                    const rows = await model.findAll({ raw: true });

                    if (!rows || rows.length === 0) continue;

                    sqlDump += `-- ------------------------------------------\n`;
                    sqlDump += `-- Data for table "${table}" (${rows.length} rows)\n`;
                    sqlDump += `-- ------------------------------------------\n`;

                    const columns = Object.keys(rows[0]);

                    for (const row of rows) {
                        const values = columns.map(col => {
                            let val = row[col];
                            if (val === null || val === undefined) return 'NULL';
                            if (typeof val === 'number') return val;
                            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';

                            if (typeof val === 'string') {
                                return `'${val.replace(/'/g, "''")}'`;
                            }

                            if (val instanceof Date) {
                                return `'${val.toISOString()}'`;
                            }

                            if (typeof val === 'object') {
                                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                            }

                            return `'${String(val).replace(/'/g, "''")}'`;
                        });

                        sqlDump += `INSERT INTO "${table}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
                    }

                    sqlDump += `\n`;
                } catch (tableExportErr) {
                    console.warn(`Could not export table:`, tableExportErr.message);
                }
            }

            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `codex_me_backup_${dateStr}.sql`;
            const encodedBuffer = new TextEncoder().encode(sqlDump);

            return new Response(encodedBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/sql; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': String(encodedBuffer.byteLength),
                    'Cache-Control': 'no-store, no-cache, must-revalidate'
                }
            });

        } catch (error) {
            console.error("Export DB API Error:", error);
            return serverError('Database export error.');
        }
    }

    static async handleDriveBackup(req) {
        try {
            const user = await requireAuth(req);
            if (!user) {
                return unauthorized('Unauthorized: Authentication required.');
            }

            if (req.method === 'GET') {
                const status = await getDatabaseBackupStatus();
                return ok(status);
            }

            const body = await req.json().catch(() => ({}));
            const action = body.action || 'backup_now';

            if (action === 'backup_now') {
                const result = await runDatabaseDriveBackup({
                    slotLabel: body.slotLabel || 'MANUAL_DASHBOARD',
                    retentionDays: 2,
                    notifyTelegram: true
                });
                const updatedStatus = await getDatabaseBackupStatus();
                return ok({
                    ...result,
                    status: updatedStatus
                });
            }

            if (action === 'cleanup_old') {
                const retentionDays = parseFloat(body.retentionDays || '2') || 2;
                const cleanup = await cleanupOldDriveDatabaseBackups({ retentionDays });
                const updatedStatus = await getDatabaseBackupStatus();
                return ok({
                    success: true,
                    cleanup,
                    status: updatedStatus
                });
            }

            if (action === 'delete_file') {
                if (!body.fileId) {
                    return badRequest('fileId is required.');
                }
                await deleteGoogleDriveFile(body.fileId);
                const updatedStatus = await getDatabaseBackupStatus();
                return ok({
                    success: true,
                    deletedFileId: body.fileId,
                    status: updatedStatus
                });
            }

            return badRequest('Invalid action.');
        } catch (err) {
            console.error('[DriveBackup Controller Error]:', err);
            return serverError(err);
        }
    }
}

export default ExportController;
