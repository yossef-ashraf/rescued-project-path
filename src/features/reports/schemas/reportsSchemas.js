export const ReportFilterSchema = {
    year: { type: 'number', required: false },
    month: { type: 'string', required: false },
    format: { type: 'string', enum: ['json', 'pdf', 'csv'], default: 'json' }
};
