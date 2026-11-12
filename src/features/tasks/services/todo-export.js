import ExcelJS from 'exceljs';
import { TodoItem } from '@/shared/models/index.js';
import { getEgyptDateStr } from '@/shared/utils/timezone.js';
import { apiError } from '@/shared/utils/api-error.js';

export async function generateTodoExport(req) {
    try {
        const url = new URL(req.url);
        const monthFilter = url.searchParams.get('month') || 'all';
        const format = url.searchParams.get('format') || 'excel';

        const todayStr = getEgyptDateStr();
        const rawItems = await TodoItem.findAll({ order: [['due_date', 'ASC'], ['id', 'ASC']], raw: true });
        const items = Array.isArray(rawItems) ? rawItems : [];

        const getItemStatus = (item) => {
            const isDone = Boolean(item.done);
            if (isDone) return { code: 'done', labelAr: 'مكتملة ✅', labelEn: 'Completed ✅', color: '10B981' };
            if (item.due_date && item.due_date < todayStr) {
                return { code: 'missed', labelAr: 'فايتة ❌', labelEn: 'Missed ❌', color: 'EF4444' };
            }
            return { code: 'pending', labelAr: 'قادمة ⏳', labelEn: 'Pending ⏳', color: 'F59E0B' };
        };

        const monthlyGroups = {};
        items.forEach(item => {
            const mKey = item.due_date && item.due_date.length >= 7 ? item.due_date.substring(0, 7) : 'No Date';
            if (!monthlyGroups[mKey]) {
                monthlyGroups[mKey] = {
                    month: mKey,
                    items: [],
                    total: 0,
                    completed: 0,
                    missed: 0,
                    pending: 0,
                    totalHours: 0,
                    completedHours: 0
                };
            }

            const status = getItemStatus(item);
            const hours = parseFloat(item.duration_hours || 1) || 1;

            monthlyGroups[mKey].items.push({ ...item, statusObj: status, hours });
            monthlyGroups[mKey].total += 1;
            monthlyGroups[mKey].totalHours += hours;

            if (status.code === 'done') {
                monthlyGroups[mKey].completed += 1;
                monthlyGroups[mKey].completedHours += hours;
            } else if (status.code === 'missed') {
                monthlyGroups[mKey].missed += 1;
            } else {
                monthlyGroups[mKey].pending += 1;
            }
        });

        Object.values(monthlyGroups).forEach(mg => {
            mg.completionRate = mg.total > 0 ? Math.round((mg.completed / mg.total) * 100) : 0;
            mg.totalHours = Math.round(mg.totalHours * 100) / 100;
            mg.completedHours = Math.round(mg.completedHours * 100) / 100;
        });

        const targetMonths = monthFilter === 'all'
            ? Object.values(monthlyGroups).sort((a, b) => b.month.localeCompare(a.month))
            : (monthlyGroups[monthFilter] ? [monthlyGroups[monthFilter]] : []);

        const targetItems = monthFilter === 'all'
            ? items.map(item => ({ ...item, statusObj: getItemStatus(item), hours: parseFloat(item.duration_hours || 1) || 1 }))
            : (monthlyGroups[monthFilter]?.items || []);

        if (format === 'json') {
            return Response.json({
                filter: monthFilter,
                months: targetMonths,
                totalItemsCount: targetItems.length
            });
        }

        if (format === 'csv') {
            const csvRows = [
                ['Month', 'Date', 'Task Name', 'Description', 'Duration Hours', 'Reminder Time', 'Status', 'Series ID'].join(',')
            ];

            targetItems.forEach(it => {
                const cleanText = `"${(it.text || '').replace(/"/g, '""')}"`;
                const cleanDesc = `"${(it.description || '').replace(/"/g, '""')}"`;
                csvRows.push([
                    it.due_date ? it.due_date.substring(0, 7) : '',
                    it.due_date || '',
                    cleanText,
                    cleanDesc,
                    it.hours,
                    it.reminder_time || '',
                    it.statusObj.labelEn,
                    it.series_id || ''
                ].join(','));
            });

            const csvString = '\uFEFF' + csvRows.join('\r\n');
            const filename = `Todo_Points_Report_${monthFilter}_${todayStr}.csv`;

            return new Response(csvString, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'The-Root';
        workbook.created = new Date();

        const setCellColors = (cell, bgHex, textHex, bold = false, fontSize = 11) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: bgHex }
            };
            cell.font = {
                bold,
                name: 'Calibri',
                size: fontSize,
                color: { argb: textHex }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'D1D5DB' } },
                left: { style: 'thin', color: { argb: 'D1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
                right: { style: 'thin', color: { argb: 'D1D5DB' } }
            };
        };

        const summarySheet = workbook.addWorksheet('ملخص الشهور', { views: [{ rightToLeft: true }] });

        summarySheet.mergeCells('A1:H2');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = `📊 تقرير ملخص إنجاز نقاط To-Do الشهرية (${monthFilter === 'all' ? 'جميع الشهور' : monthFilter})`;
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' }, name: 'Calibri' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0e0e119e' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        const summaryHeaders = [
            'الشهر (Month)',
            'إجمالي النقاط (Total)',
            'النقاط الصح (Done ✅)',
            'النقاط الفايتة (Missed ❌)',
            'النقاط القادمة (Pending ⏳)',
            'نسبة الإنجاز (Rate %)',
            'الساعات المخططة (Total Hrs)',
            'الساعات المنجزة (Done Hrs)'
        ];

        summarySheet.addRow([]);
        const headerRow = summarySheet.addRow(summaryHeaders);
        headerRow.height = 26;
        headerRow.eachCell((cell) => {
            setCellColors(cell, '27272A', 'FFFFFF', true, 11);
        });

        let grandTotal = 0;
        let grandDone = 0;
        let grandMissed = 0;
        let grandPending = 0;
        let grandTotalHours = 0;
        let grandDoneHours = 0;

        targetMonths.forEach((mg, index) => {
            grandTotal += mg.total;
            grandDone += mg.completed;
            grandMissed += mg.missed;
            grandPending += mg.pending;
            grandTotalHours += mg.totalHours;
            grandDoneHours += mg.completedHours;

            const row = summarySheet.addRow([
                mg.month,
                mg.total,
                mg.completed,
                mg.missed,
                mg.pending,
                `${mg.completionRate}%`,
                mg.totalHours,
                mg.completedHours
            ]);
            row.height = 22;

            const bgHex = index % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
            row.eachCell((cell, colNum) => {
                let cellBg = bgHex;
                let textHex = '111827';
                let bold = false;

                if (colNum === 3) {
                    cellBg = 'DCFCE7';
                    textHex = '166534';
                    bold = true;
                } else if (colNum === 4 && mg.missed > 0) {
                    cellBg = 'FEE2E2';
                    textHex = '991B1B';
                    bold = true;
                } else if (colNum === 6) {
                    bold = true;
                    if (mg.completionRate >= 80) textHex = '166534';
                    else if (mg.completionRate >= 50) textHex = '854D0E';
                    else textHex = '991B1B';
                }

                setCellColors(cell, cellBg, textHex, bold, 10);
            });
        });

        const grandRate = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;
        const totalRow = summarySheet.addRow([
            'الإجمالي العام (Total)',
            grandTotal,
            grandDone,
            grandMissed,
            grandPending,
            `${grandRate}%`,
            Math.round(grandTotalHours * 100) / 100,
            Math.round(grandDoneHours * 100) / 100
        ]);
        totalRow.height = 26;
        totalRow.eachCell((cell) => {
            setCellColors(cell, '0e0e119e', 'FFFFFF', true, 11);
        });

        summarySheet.columns = [
            { width: 20 },
            { width: 18 },
            { width: 18 },
            { width: 18 },
            { width: 18 },
            { width: 18 },
            { width: 22 },
            { width: 22 }
        ];

        const detailSheet = workbook.addWorksheet('تفاصيل المهام والنقاط', { views: [{ rightToLeft: true }] });

        detailSheet.mergeCells('A1:I2');
        const dTitleCell = detailSheet.getCell('A1');
        dTitleCell.value = `📝 تفاصيل وقائمة مهام ونقاط To-Do (${monthFilter === 'all' ? 'جميع الشهور' : monthFilter})`;
        dTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFF' }, name: 'Calibri' };
        dTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0e0e119e' } };
        dTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        detailSheet.addRow([]);

        const detailHeaders = [
            'الشهر (Month)',
            'التاريخ (Date)',
            'اسم النقطة / المهمة (Task Name)',
            'التفاصيل (Description)',
            'الساعات (Hours)',
            'الوقت (Time)',
            'الحالة (Status)',
            'معرف السلسلة (Series ID)',
            'تاريخ الإنشاء (Created At)'
        ];

        const dHeaderRow = detailSheet.addRow(detailHeaders);
        dHeaderRow.height = 26;
        dHeaderRow.eachCell((cell) => {
            setCellColors(cell, '27272A', 'FFFFFF', true, 11);
        });

        targetItems.forEach((it, index) => {
            const mStr = it.due_date ? it.due_date.substring(0, 7) : 'No Date';
            const row = detailSheet.addRow([
                mStr,
                it.due_date || 'بدون تاريخ',
                it.text || '',
                it.description || '',
                it.hours,
                it.reminder_time || '-',
                it.statusObj.labelAr,
                it.series_id || '-',
                it.created_at ? new Date(it.created_at).toLocaleDateString() : '-'
            ]);
            row.height = 22;

            const bgHex = index % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
            row.eachCell((cell, colNum) => {
                let cellBg = bgHex;
                let textHex = '111827';
                let bold = false;

                if (colNum === 3) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }

                if (colNum === 7) {
                    bold = true;
                    if (it.statusObj.code === 'done') {
                        cellBg = 'DCFCE7';
                        textHex = '166534';
                    } else if (it.statusObj.code === 'missed') {
                        cellBg = 'FEE2E2';
                        textHex = '991B1B';
                    } else {
                        cellBg = 'FEF3C7';
                        textHex = '92400E';
                    }
                }

                setCellColors(cell, cellBg, textHex, bold, 10);
            });
        });

        detailSheet.columns = [
            { width: 16 },
            { width: 16 },
            { width: 35 },
            { width: 30 },
            { width: 14 },
            { width: 14 },
            { width: 18 },
            { width: 22 },
            { width: 16 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `Todo_Points_Report_${monthFilter}_${todayStr}.xlsx`;

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (err) {
        return apiError(err);
    }
}
