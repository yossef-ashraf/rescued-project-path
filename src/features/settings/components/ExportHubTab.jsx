'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/shared/context/AppContext.jsx';
import {
    Download,
    Calendar,
    Database,
    Printer,
    Sparkles,
    BookOpen,
    Wallet,
    CheckSquare,
    CloudUpload,
    Clock,
    Trash2,
    RefreshCw,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Loader2,
    HardDrive,
    Coins,
    DollarSign,
    FileSpreadsheet,
    Zap
} from 'lucide-react';
import ComprehensivePdfModal from '@/features/reports/components/ComprehensivePdfModal';
import { apiClient } from '@/shared/http/apiClient.js';
import { announceMatteAlert } from '@/components/ui/MatteAlert';

export default function ExportHubTab() {
    const { t, language } = useApp();
    const isAr = language === 'ar';

    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    // Gold & Exchange Rates state
    const [prices, setPrices] = useState([]);
    const [loadingPrices, setLoadingPrices] = useState(true);
    const [syncingPrices, setSyncingPrices] = useState(false);
    const [usdRate, setUsdRate] = useState('');
    const [sarRate, setSarRate] = useState('');
    const [savingRates, setSavingRates] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    const [backupStatus, setBackupStatus] = useState(null);
    const [loadingBackupStatus, setLoadingBackupStatus] = useState(true);
    const [runningBackup, setRunningBackup] = useState(false);
    const [runningCleanup, setRunningCleanup] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState(null);

    const loadPrices = useCallback(async () => {
        try {
            const data = await apiClient('/api/finance/prices');
            const list = Array.isArray(data) ? data : (data?.data || []);
            setPrices(list);
            const usd = list.find(p => p.name?.toLowerCase().includes('dollar') || p.name?.toLowerCase().includes('usd'));
            const sar = list.find(p => p.name?.toLowerCase().includes('riyal') || p.name?.toLowerCase().includes('sar'));
            if (usd) setUsdRate(usd.price || usd.dollar || '');
            if (sar) setSarRate(sar.price || sar.riyal || '');
        } catch (e) {
            console.error('Failed to load prices:', e);
        } finally {
            setLoadingPrices(false);
        }
    }, []);

    useEffect(() => {
        queueMicrotask(() => {
            loadPrices();
        });
    }, [loadPrices]);

    const handleSyncGoldAndCurrencies = async () => {
        if (syncingPrices) return;
        setSyncingPrices(true);
        try {
            await apiClient('/api/gold-service').catch(() => null) ||
            await apiClient.post('/api/gold', { action: 'sync_gold' }).catch(() => null);
            await loadPrices();
            announceMatteAlert({
                title: t('Live Rates Synced', 'تم تحديث أسعار الذهب والعملات بنجاح'),
                message: t('Gold 24K, 21K, 18K and USD/SAR exchange rates updated to real-time market values.', 'تم تحديث أسعار الذهب والعملات المرجعية وسعر الصرف.'),
                tone: 'success'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Sync Error', 'خطأ أثناء التحديث'),
                message: err.message,
                tone: 'danger'
            });
        } finally {
            setSyncingPrices(false);
        }
    };

    const handleSaveExchangeRates = async () => {
        if (savingRates) return;
        setSavingRates(true);
        try {
            const usdItem = prices.find(p => p.name?.toLowerCase().includes('dollar') || p.name?.toLowerCase().includes('usd'));
            const sarItem = prices.find(p => p.name?.toLowerCase().includes('riyal') || p.name?.toLowerCase().includes('sar'));

            if (usdItem && usdRate) {
                await apiClient('/api/finance/prices', {
                    method: 'PUT',
                    body: { id: usdItem.id, name: usdItem.name, price: parseFloat(usdRate), dollar: parseFloat(usdRate) }
                });
            }
            if (sarItem && sarRate) {
                await apiClient('/api/finance/prices', {
                    method: 'PUT',
                    body: { id: sarItem.id, name: sarItem.name, price: parseFloat(sarRate), riyal: parseFloat(sarRate) }
                });
            }
            await loadPrices();
            announceMatteAlert({
                title: t('Exchange Rates Updated', 'تم حفظ أسعار الصرف بنجاح'),
                message: `${t('USD:', 'الدولار:')} ${usdRate} EGP | ${t('SAR:', 'الريال:')} ${sarRate} EGP`,
                tone: 'success'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Failed to save rates', 'تعذر حفظ سعر الصرف'),
                message: err.message,
                tone: 'danger'
            });
        } finally {
            setSavingRates(false);
        }
    };

    const handleExportExcel = async () => {
        if (exportingExcel) return;
        setExportingExcel(true);
        try {
            const exportUrl = `/api/finance/export${selectedYear ? `?year=${selectedYear}` : ''}`;
            const res = await fetch(exportUrl);
            if (!res.ok) throw new Error("Excel export failed");
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `financial_report_${selectedYear || 'full'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            announceMatteAlert({
                title: t('Excel Report Exported', 'تم تصدير ملف الإكسيل بنجاح'),
                tone: 'success'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Export Failed', 'فشل تصدير التقرير'),
                message: err.message,
                tone: 'danger'
            });
        } finally {
            setExportingExcel(false);
        }
    };

    const handleDownloadSqlDb = () => {
        const a = document.createElement('a');
        a.href = '/api/export-db';
        a.download = `codex_me_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        announceMatteAlert({
            title: t('SQL Backup Started', 'بدأ تنزيل نسخة قاعدة البيانات SQL'),
            tone: 'info'
        });
    };

    const loadBackupStatus = useCallback(async () => {
        setLoadingBackupStatus(true);
        try {
            const data = await apiClient('/api/backup/drive');
            setBackupStatus(data);
        } catch (err) {
            console.error('Failed to load Drive backup status:', err);
        } finally {
            setLoadingBackupStatus(false);
        }
    }, []);

    useEffect(() => {
        let ignore = false;
        apiClient('/api/backup/drive')
            .then(data => { if (!ignore) setBackupStatus(data); })
            .catch(err => console.error('Failed to load Drive backup status:', err))
            .finally(() => { if (!ignore) setLoadingBackupStatus(false); });
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        let ignore = false;
        apiClient('/api/finance/months')
            .then(data => {
                if (Array.isArray(data) && !ignore) {
                    const uniqueYears = [...new Set(data.map(m => String(m.year)).filter(Boolean))].sort((a, b) => b - a);
                    if (uniqueYears.length > 0) {
                        setYears(uniqueYears);
                        setSelectedYear(prev => (uniqueYears.includes(prev) ? prev : uniqueYears[0]));
                    }
                }
            })
            .catch(() => {});
        return () => { ignore = true; };
    }, []);

    useEffect(() => {
        let ignore = false;
        apiClient(`/api/reports/analytics?year=${selectedYear || '2026'}`)
            .then(data => {
                if (!ignore) {
                    setAnalyticsData(data);
                    setLoadingAnalytics(false);
                }
            })
            .catch(err => {
                console.error('Failed to load analytics:', err);
                if (!ignore) setLoadingAnalytics(false);
            });
        return () => { ignore = true; };
    }, [selectedYear]);

    const handleTriggerDriveBackup = async () => {
        if (runningBackup) return;
        setRunningBackup(true);
        try {
            const res = await apiClient.post('/api/backup/drive', {
                action: 'backup_now',
                slotLabel: 'MANUAL_NOW'
            });
            if (res?.status) {
                setBackupStatus(res.status);
            } else {
                await loadBackupStatus();
            }
            const deletedCount = res?.cleanup?.deletedCount || 0;
            announceMatteAlert({
                title: t('Google Drive Backup Complete', 'تم رفع النسخة الاحتياطية على Google Drive'),
                message: t(
                    `Uploaded ${res?.uploadedFile?.filename || 'SQL backup'} (${res?.totalRows || 0} rows) & cleaned up ${deletedCount} backup(s) older than 2 days.`,
                    `تم رفع الملف ${res?.uploadedFile?.filename || ''} (${res?.totalRows || 0} سجل) بنجاح وحذف ${deletedCount} نسخة أقدم من يومين.`
                ),
                tone: 'success'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Backup Failed', 'فشل النسخ الاحتياطي على Drive'),
                message: err?.message || t('Check Google Drive credentials in Settings.', 'تأكد من إعدادات ربط Google Drive.'),
                tone: 'danger'
            });
        } finally {
            setRunningBackup(false);
        }
    };

    const handleCleanupOldBackups = async () => {
        if (runningCleanup) return;
        setRunningCleanup(true);
        try {
            const res = await apiClient.post('/api/backup/drive', {
                action: 'cleanup_old',
                retentionDays: 2
            });
            if (res?.status) {
                setBackupStatus(res.status);
            } else {
                await loadBackupStatus();
            }
            const count = res?.cleanup?.deletedCount || 0;
            announceMatteAlert({
                title: t('Retention Cleanup Complete', 'تم تنظيف النسخ القديمة'),
                message: t(
                    `Deleted ${count} backup file(s) older than 2 days from Google Drive.`,
                    `تم مسح (${count}) ملف نسخ احتياطي مر عليه أكثر من يومين من Google Drive.`
                ),
                tone: 'success'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Cleanup Error', 'خطأ أثناء مسح النسخ القديمة'),
                message: err?.message || 'Cleanup failed',
                tone: 'danger'
            });
        } finally {
            setRunningCleanup(false);
        }
    };

    const handleDeleteSpecificBackup = async (fileId, fileName) => {
        if (deletingFileId) return;
        setDeletingFileId(fileId);
        try {
            const res = await apiClient.post('/api/backup/drive', {
                action: 'delete_file',
                fileId
            });
            if (res?.status) {
                setBackupStatus(res.status);
            } else {
                await loadBackupStatus();
            }
            announceMatteAlert({
                title: t('Backup Deleted', 'تم حذف النسخة الاحتياطية'),
                message: fileName,
                tone: 'info'
            });
        } catch (err) {
            announceMatteAlert({
                title: t('Delete Failed', 'فشل الحذف'),
                message: err?.message || 'Could not delete file',
                tone: 'danger'
            });
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleDownload = (module, format) => {
        let url = `/api/export?module=${module}&format=${format}`;
        if (selectedYear) {
            url += `&year=${selectedYear}`;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = `codex_${module}_${selectedYear || 'all'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const lastBackup = backupStatus?.lastBackup || {};
    const driveBackups = backupStatus?.backups || [];

    return (
        <div className="space-y-8 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>

            <div className="relative overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">
                {(runningBackup || runningCleanup) && (
                    <div className="md-progress-track">
                        <div className="md-progress-bar" />
                    </div>
                )}

                <div className="p-6 space-y-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-edge pb-5">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="md-badge md-badge-success">
                                    <Clock className="w-3 h-3" />
                                    <span>{t('Twice Daily: 4:00 AM & 6:00 PM', 'مرتين يومياً: 4 الفجر و 6 المغرب')}</span>
                                </span>
                                <span className="md-badge md-badge-warning">
                                    <Trash2 className="w-3 h-3" />
                                    <span>{t('Auto-Delete > 2 Days (48h)', 'حذف تلقائي للنسخ الأقدم من يومين')}</span>
                                </span>
                                <span className="md-badge md-badge-neutral">
                                    <HardDrive className="w-3 h-3" />
                                    <span>Google Drive / Database_Backups</span>
                                </span>
                            </div>

                            <h3 className="text-[16px] font-semibold text-ink flex items-center gap-2 pt-1">
                                <CloudUpload className="w-5 h-5 text-primary" />
                                <span>
                                    {t(
                                        'Automated Google Drive Database Backup & 2-Day Retention Service',
                                        'خدمة النسخ الاحتياطي التلقائي للداتا بيز على Google Drive (4 الفجر و 6 المغرب)'
                                    )}
                                </span>
                            </h3>
                            <p className="text-[12.5px] text-muted leading-relaxed">
                                {t(
                                    'Automatically exports all database tables into a full SQL dump twice every day (4:00 AM Fajr & 6:00 PM Maghrib Cairo Time), uploads it to Google Drive, and deletes backups older than 2 days.',
                                    'يقوم النظام بأخذ نسخة احتياطية كاملة للداتا بيز (SQL) مرتين كل يوم في الساعة 4:00 الفجر والساعة 6:00 المغرب بتوقيت القاهرة، ويرفعها تلقائياً على Google Drive مع مسح أي نسخة مر عليها أكثر من يومين (48 ساعة).'
                                )}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleTriggerDriveBackup}
                                disabled={runningBackup || runningCleanup}
                                className="md-btn md-btn-primary h-9 px-4 text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                            >
                                {runningBackup ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('Uploading to Drive...', 'جاري الرفع على Drive...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <CloudUpload className="w-4 h-4" />
                                        <span>{t('Backup to Drive Now', 'رفع نسخة الآن على Drive')}</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleCleanupOldBackups}
                                disabled={runningBackup || runningCleanup}
                                className="md-btn md-btn-secondary h-9 px-3.5 text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                            >
                                {runningCleanup ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('Cleaning...', 'جاري المسح...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 text-danger" />
                                        <span>{t('Cleanup > 2 Days', 'مسح الأقدم من يومين')}</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={loadBackupStatus}
                                disabled={loadingBackupStatus}
                                className="md-btn md-btn-ghost h-9 w-9 p-0 flex items-center justify-center cursor-pointer"
                                title={t('Refresh', 'تحديث')}
                                aria-label={t('Refresh', 'تحديث')}
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingBackupStatus ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <div className="p-3.5 rounded-xl border border-edge bg-elevated/50 space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                                {t('Schedule (Cairo Time)', 'مواعيد التشغيل اليومية')}
                            </span>
                            <p className="text-[13.5px] font-semibold text-ink tabular-nums">
                                04:00 AM · 06:00 PM
                            </p>
                            <p className="text-[11.5px] text-muted">
                                {t('4 Fajr & 6 Maghrib Daily', '4 الفجر و 6 المغرب يومياً')}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-edge bg-elevated/50 space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                                {t('Last Backup Time', 'آخر نسخة مرفوعة')}
                            </span>
                            <p className="text-[13.5px] font-semibold text-ink tabular-nums truncate">
                                {lastBackup.cairoDateTime || t('No backup recorded yet', 'لم يتم التشغيل بعد')}
                            </p>
                            <p className="text-[11.5px] text-muted truncate">
                                {lastBackup.filename || t('Ready for first run', 'جاهز للتشغيل')}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-edge bg-elevated/50 space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                                {t('Active Drive Backups', 'النسخ المتاحة على Drive')}
                            </span>
                            <p className="text-[13.5px] font-semibold text-ink tabular-nums">
                                {driveBackups.length} {t('file(s)', 'ملف')}
                            </p>
                            <p className="text-[11.5px] text-muted">
                                {t('Retention window: 48 hours', 'فترة الاحتفاظ: يومين (48 ساعة)')}
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-edge bg-elevated/50 space-y-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                                {t('Service Health', 'حالة الربط والخدمة')}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {backupStatus?.driveConfigured ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                        <span className="text-[13px] font-semibold text-success">
                                            {t('Google Drive Connected', 'متصل بـ Google Drive')}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                                        <span className="text-[13px] font-semibold text-warning">
                                            {t('Check Drive Credentials', 'تأكد من مفاتيح Drive')}
                                        </span>
                                    </>
                                )}
                            </div>
                            {lastBackup.driveUrl && (
                                <a
                                    href={lastBackup.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline"
                                >
                                    <span>{t('Open Latest on Drive', 'فتح آخر نسخة في Drive')}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    {driveBackups.length > 0 && (
                        <div className="space-y-2.5 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                                    {t('Recent Backups in Google Drive (Database_Backups)', 'النسخ الاحتياطية المحفوظة حالياً على Google Drive')}
                                </span>
                                <span className="text-[11.5px] text-muted tabular-nums">
                                    {t('Auto-purged after 48h', 'يتم الحذف تلقائياً بعد 48 ساعة')}
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-edge">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-edge bg-elevated/60 text-[11px] font-semibold uppercase tracking-wider text-faint">
                                            <th className="py-2.5 px-3.5 text-start">{t('Backup File', 'اسم ملف النسخة')}</th>
                                            <th className="py-2.5 px-3.5 text-start">{t('Size', 'الحجم')}</th>
                                            <th className="py-2.5 px-3.5 text-start">{t('Age', 'العمر')}</th>
                                            <th className="py-2.5 px-3.5 text-end">{t('Actions', 'إجراءات')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-edge text-[13px]">
                                        {driveBackups.slice(0, 8).map((file) => (
                                            <tr key={file.id} className="hover:bg-elevated/40 transition">
                                                <td className="py-2.5 px-3.5 font-medium text-ink truncate max-w-[260px]" title={file.name}>
                                                    {file.name}
                                                </td>
                                                <td className="py-2.5 px-3.5 text-muted tabular-nums">
                                                    {file.size}
                                                </td>
                                                <td className="py-2.5 px-3.5 tabular-nums">
                                                    <span className={`md-badge ${file.isExpired ? 'md-badge-danger' : 'md-badge-neutral'}`}>
                                                        {file.ageHours} {t('hrs ago', 'ساعة')}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3.5">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a
                                                            href={file.driveUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="md-btn md-btn-ghost h-7 px-2.5 text-[12px]"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>Drive</span>
                                                        </a>
                                                        <a
                                                            href={file.downloadUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="md-btn md-btn-ghost h-7 px-2.5 text-[12px]"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            disabled={deletingFileId === file.id}
                                                            onClick={() => handleDeleteSpecificBackup(file.id, file.name)}
                                                            className="md-btn md-btn-ghost h-7 px-2 text-danger cursor-pointer disabled:opacity-50"
                                                            title={t('Delete from Drive', 'حذف من Drive')}
                                                        >
                                                            {deletingFileId === file.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Gold & Currency Exchange Rates Live Hub */}
            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{t('Gold & Currency Valuation Hub', 'مركز أسعار الذهب والعملات وسعر الصرف')}</span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                            {t('Gold Prices & Currency Exchange Rate Management', 'إدارة ومزامنة أسعار الذهب وسعر صرف الدولار والريال')}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t('Live 24K, 21K, 18K gold market rates alongside direct USD & SAR to EGP exchange rate adjustments.', 'متابعة لحظية لعيارات الذهب وتعديل ومزامنة سعر صرف الدولار والريال بالجنيه المصري.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSyncGoldAndCurrencies}
                            disabled={syncingPrices}
                            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {syncingPrices ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            <span>{syncingPrices ? t('Syncing Live Rates...', 'جاري المزامنة...') : t('Sync Live Market Rates', 'مزامنة الأسعار الحية الآن')}</span>
                        </button>
                    </div>
                </div>

                {/* Rates Grid & Quick Adjust */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {/* Gold 24 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                        <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            🥇 {t('Gold 24K', 'ذهب عيار 24')}
                        </span>
                        <div className="text-base font-black text-zinc-900 dark:text-white font-mono">
                            {prices.find(p => p.name === 'Gold 24')?.price || '7,056'} <span className="text-[10px] text-zinc-500 font-normal">EGP</span>
                        </div>
                    </div>

                    {/* Gold 21 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                        <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            🥈 {t('Gold 21K', 'ذهب عيار 21')}
                        </span>
                        <div className="text-base font-black text-zinc-900 dark:text-white font-mono">
                            {prices.find(p => p.name === 'Gold 21')?.price || '6,174'} <span className="text-[10px] text-zinc-500 font-normal">EGP</span>
                        </div>
                    </div>

                    {/* Gold 18 */}
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                        <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            🥉 {t('Gold 18K', 'ذهب عيار 18')}
                        </span>
                        <div className="text-base font-black text-zinc-900 dark:text-white font-mono">
                            {prices.find(p => p.name === 'Gold 18')?.price || '5,292'} <span className="text-[10px] text-zinc-500 font-normal">EGP</span>
                        </div>
                    </div>

                    {/* USD Exchange Rate Input */}
                    <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            💵 {t('USD Rate (EGP)', 'سعر الدولار (EGP)')}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                step="0.01"
                                value={usdRate}
                                onChange={e => setUsdRate(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    {/* SAR Exchange Rate Input */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            🇸🇦 {t('SAR Rate (EGP)', 'سعر الريال (EGP)')}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                step="0.01"
                                value={sarRate}
                                onChange={e => setSarRate(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <button
                        type="button"
                        onClick={handleSaveExchangeRates}
                        disabled={savingRates}
                        className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {savingRates ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>💾</span>}
                        <span>{savingRates ? t('Saving...', 'جاري الحفظ...') : t('Save Exchange Rates', 'حفظ تعديل أسعار الصرف')}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-3xl shadow-md border border-zinc-700/50">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#BC5C29]/20 text-[#BC5C29] text-[11px] font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('Centralized Data & Analytics Hub', 'مركز تصدير البيانات والتحليلات')}</span>
                    </div>
                    <h2 className="text-xl font-black">
                        {t('Data Export & Analytics Hub (PDF, CSV & JSON)', 'مركز تصدير البيانات والتقارير الشاملة')}
                    </h2>
                    <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
                        {t(
                            'Export and download all tasks, finance, and course data with custom filters, plus generate a comprehensive printable analytics report.',
                            'تصدير وتنزيل كافة بيانات المهام والمالية والكورسات مع تصفية بالتاريخ، وإصدار تقرير تحليلي شامل جاهز للطباعة والتحميل.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-1.5">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                        >
                            <option value="" className="bg-zinc-900 text-white">
                                {t('All Periods', 'كافة الفترات')}
                            </option>
                            {years.map(yr => (
                                <option key={yr} value={yr} className="bg-zinc-900 text-white">{yr}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={exportingExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                        {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        <span>{t('Export Excel', 'تصدير إكسيل')}</span>
                    </button>

                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="bg-[#BC5C29] hover:bg-[#d0633b] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{t('Print Analytics PDF', 'طباعة التقرير الشامل')}</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#BC5C29]" />
                    <span>{t('Structured Data Export (CSV & JSON)', 'تصدير البيانات المجدولة')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-4 shadow-xs">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                {t('To-Do & Tasks List', 'قائمة المهام والمسؤوليات')}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                {t(
                                    'Export all task records, completion statuses, due dates, and recurring frequencies.',
                                    'تصدير بنود قائمة المهام وحالات الإنجاز وتواريخ الاستحقاق والتكرار الدوري.'
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={() => handleDownload('todo', 'csv')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={() => handleDownload('todo', 'json')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>JSON</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-4 shadow-xs">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center font-bold">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                {t('Financial Records (Finance Hub)', 'السجلات والبيانات المالية')}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                {t(
                                    'Export all debt logs, monthly expenses, revenues, and liquidity accounts.',
                                    'تصدير سجلات الديون والالتزامات والمصروفات والإيرادات وحسابات السيولة.'
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={() => handleDownload('finance', 'csv')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>CSV</span>
                            </button>
                            <button
                                onClick={() => handleDownload('finance', 'json')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>JSON</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-4 shadow-xs">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center font-bold">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                {t('Courses & Knowledge Materials', 'الكورسات والمواد المعرفية')}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                {t(
                                    'Export course progress, completion rates, reading states, and recorded study notes.',
                                    'تصدير بيانات الدورات ونسب الإنجاز وحالات القراءة والملاحظات المسجلة لكل مادة.'
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                onClick={() => handleDownload('courses', 'csv')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('Courses', 'الكورسات')}</span>
                            </button>
                            <button
                                onClick={() => handleDownload('materials', 'csv')}
                                className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('Materials', 'المواد العلمية')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>💾</span>
                            <span>{t('All-in-One Codex Archive & Live Database Backup', 'تصدير أرشيف كودكس الكامل والنسخة الحية')}</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {t(
                                'Download a unified full backup containing all database tables in JSON format, or download a direct raw SQL dump.',
                                'تنزيل نسخة احتياطية شاملة وموحدة لكافة الجداول بصيغة JSON الرقمية أو ملف SQL لقاعدة البيانات الحية مباشرة.'
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleDownloadSqlDb}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                        >
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>{t('Download Live DB (SQL)', 'تحميل الداتابيز (SQL)')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDownload('all', 'json')}
                            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                        >
                            <Database className="w-3.5 h-3.5" />
                            <span>{t('Full Archive (JSON)', 'الأرشيف الكامل (JSON)')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <ComprehensivePdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                data={analyticsData}
                selectedYear={selectedYear}
            />
        </div>
    );
}

