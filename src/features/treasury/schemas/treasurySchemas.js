/**
 * Treasury Validation Schemas
 * Architecture v2
 */

export const transactionSchema = {
    month_id: { type: 'number', required: true, message: 'معرف الشهر مطلوب' },
    type: { type: 'string', required: true, enum: ['income', 'expense'], message: 'نوع المعاملة يجب أن يكون دخل أو مصروف' },
    amount: { type: 'number', required: true, message: 'المبلغ مطلوب ويجب أن يكون رقماً' },
    category: { type: 'string', required: false, default: 'General' },
    description: { type: 'string', required: false },
    date: { type: 'string', required: false }
};

export const debtSchema = {
    month_id: { type: 'number', required: true },
    person_name: { type: 'string', required: true, message: 'اسم الدائن/المدين مطلوب' },
    amount: { type: 'number', required: true },
    type: { type: 'string', required: true, enum: ['debt', 'credit'] },
    status: { type: 'string', required: false, default: 'pending' },
    due_date: { type: 'string', required: false },
    notes: { type: 'string', required: false }
};

export const goldAssetSchema = {
    weight_grams: { type: 'number', required: true, message: 'الوزن بالجرام مطلوب' },
    karat: { type: 'number', required: false, default: 24 },
    purchase_price_per_gram: { type: 'number', required: true },
    purchase_date: { type: 'string', required: false },
    notes: { type: 'string', required: false }
};

const serviceExports = {
    transactionSchema,
    debtSchema,
    goldAssetSchema
};

export default serviceExports;
