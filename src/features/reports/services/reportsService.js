export const reportsService = {
    formatReportPeriod(year, month) {
        return `${month || 'Full Year'} ${year || new Date().getFullYear()}`;
    }
};
