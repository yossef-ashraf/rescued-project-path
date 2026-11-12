/**
 * Import Pipeline Service
 * Section 34.7 & 34.8 — Orbit Architecture v2
 */

export function previewImportData(rawRows = [], entityType = 'tasks', columnMappings = {}) {
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
        return {
            valid: false,
            totalRows: 0,
            previewRows: [],
            errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة']
        };
    }

    const errors = [];
    const validRows = [];

    rawRows.forEach((row, idx) => {
        const mapped = {};
        for (const [sourceCol, targetField] of Object.entries(columnMappings)) {
            mapped[targetField] = row[sourceCol];
        }

        // Basic validation per entity type
        if (entityType === 'tasks' && !mapped.text && !row.text && !row.title) {
            errors.push(`الصف ${idx + 1}: نص المهمة مفقود`);
        } else if (entityType === 'courses' && !mapped.title && !row.title) {
            errors.push(`الصف ${idx + 1}: عنوان الدورة مفقود`);
        } else {
            validRows.push({ ...row, ...mapped });
        }
    });

    return {
        valid: errors.length === 0,
        totalRows: rawRows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        previewRows: validRows.slice(0, 5),
        errors: errors.slice(0, 10)
    };
}

const serviceExports = {
    previewImportData
};

export default serviceExports;
