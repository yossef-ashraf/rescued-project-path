'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Key, Trash2, CheckCircle, XCircle, ShieldCheck, UserCheck, Shield, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useSearchParams, useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import DashboardHubPills from '@/components/layout/DashboardHubPills';
import UsersTab from '@/features/settings/components/UsersTab';
import PasswordsTab from '@/features/settings/components/PasswordsTab';
import ExportHubTab from '@/features/settings/components/ExportHubTab';
import SettingsActivityTimeline from '@/features/settings/components/SettingsActivityTimeline';

import {
    fetchDriveFiles,
    fetchSettings,
    saveSettings as apiSaveSettings,
    fetchFinanceMonths,
    fetchLocalMedia,
    logoutAllSessions as apiLogoutAllSessions,
    triggerGoldSync,
    triggerExportDownload
} from '@/features/settings/api/settings.api.js';

export default function SettingsDashboardView({ initialTab }) {
    const { t, setActiveDashboard } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab');

    const resolveTab = (current) => {
        if (current && ['drive_config', 'keys'].includes(current)) return 'drive_config';
        if (current && ['drive_media', 'drive', 'media', 'local'].includes(current)) return 'media';
        if (current && ['automation', 'backup', 'reports', 'export_hub', 'export', 'hub', 'reports_hub'].includes(current)) return 'automation';
        if (current && ['users', 'team'].includes(current)) return 'users';
        if (current && ['passwords', 'vault', 'keys_vault'].includes(current)) return 'passwords';
        return initialTab || 'drive_config';
    };

    const targetTab = resolveTab(initialTab || tabParam);
    const [activeTab, setActiveTab] = useState(targetTab);
    const [prevTargetTab, setPrevTargetTab] = useState(targetTab);
    if (prevTargetTab !== targetTab) {
        setPrevTargetTab(targetTab);
        setActiveTab(targetTab);
    }

    const [showGlobalLogoutModal, setShowGlobalLogoutModal] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    useEffect(() => {
        setActiveDashboard('settings');
    }, [setActiveDashboard]);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const [form, setForm] = useState({
        ENABLE_GOOGLE_DRIVE: 'false',
        GOOGLE_DRIVE_CLIENT_ID: '',
        GOOGLE_DRIVE_CLIENT_SECRET: '',
        GOOGLE_DRIVE_REFRESH_TOKEN: '',
        GOOGLE_DRIVE_FOLDER_ID: '',
        GOLD_API_KEY: '',
        DEFAULT_COMPANY: 'ME'
    });


    const [driveMediaFiles, setDriveMediaFiles] = useState([]);
    const [loadingDriveMedia, setLoadingDriveMedia] = useState(false);
    const [driveError, setDriveError] = useState(null);
    const [isDriveConfigured, setIsDriveConfigured] = useState(true);


    const [logs, setLogs] = useState([]);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');


    const [mediaFiles, setMediaFiles] = useState([]);
    const [loadingMedia, setLoadingMedia] = useState(true);
    const [mediaFilter, setMediaFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const fetchDriveMedia = () => {
        setLoadingDriveMedia(true);
        setDriveError(null);
        fetchDriveFiles()
            .then(data => {
                const resData = data && typeof data.json === 'function' ? data : data;
                if (resData.configured === false) {
                    setIsDriveConfigured(false);
                } else if (resData.error) {
                    setDriveError(resData.error);
                } else {
                    setIsDriveConfigured(true);
                    setDriveMediaFiles(resData.files || []);
                }
                setLoadingDriveMedia(false);
            })
            .catch(err => {
                setDriveError(err?.message || 'Failed to load Google Drive media');
                setLoadingDriveMedia(false);
            });
    };

    useEffect(() => {
        fetchSettings()
            .then(data => {
                if (data && data.map) {
                    setForm(prev => ({
                        ...prev,
                        ...data.map
                    }));
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Settings load error:', err);
                setLoading(false);
            });

        fetchFinanceMonths()
            .then(data => {
                const months = Array.isArray(data) ? data : (data?.months || []);
                const uniqueYears = [...new Set(months.map(m => m.year).filter(Boolean))].sort((a, b) => b - a);
                setYears(uniqueYears);
            })
            .catch(err => console.error('Finance months load error:', err));

        fetchLocalMedia()
            .then(data => {
                setMediaFiles(data?.files || []);
                setLoadingMedia(false);
            })
            .catch(err => {
                console.error('Local media load error:', err);
                setLoadingMedia(false);
            });

        fetchDriveFiles()
            .then(data => {
                if (data.configured === false) {
                    setIsDriveConfigured(false);
                } else if (data.error) {
                    setDriveError(data.error);
                } else {
                    setIsDriveConfigured(true);
                    setDriveMediaFiles(data.files || []);
                }
            })
            .catch(() => {});
    }, []);

    const handleChange = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const handleGlobalLogout = async () => {
        setIsRevoking(true);
        try {
            await apiLogoutAllSessions();
            window.location.href = '/login';
        } catch (e) {
            announceMatteAlert({ tone: 'danger', title: 'Session termination failed', description: e.message });
            setIsRevoking(false);
            setShowGlobalLogoutModal(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await apiSaveSettings({ settings: form });
            setMessage({ type: 'success', text: "Settings updated successfully!" });
            fetchDriveMedia();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || "Failed to update settings." });
        } finally {
            setSaving(false);
        }
    };


    const filteredLocalMedia = mediaFiles.filter(file => {
        if (mediaFilter === 'images' && !file.isImage) return false;
        if (mediaFilter === 'docs' && file.isImage) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return file.name.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="settings-shell space-y-6 max-w-6xl mx-auto animate-fade-in pb-16">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                        {t("System Settings & Cloud Storage", "إعدادات النظام والتحكم السحابي")}
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {t("Manage Google Drive API integrations, gold prices, database backups, and local file storage.", "إدارة خدمات Google Drive، النسخ الاحتياطي، المستخدمين، وأمان الجلسات.")}
                    </p>
                </div>

                <button
                    onClick={() => setShowGlobalLogoutModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-xs font-black shadow-xs transition cursor-pointer"
                    title={t("Terminate all active sessions on all devices for all users", "تسجيل الخروج من كافة الأجهزة لجميع المستخدمين")}
                >
                    <LogOut className="w-4 h-4" />
                    <span>{t("Logout All Devices", "خروج من كل الأجهزة للجميع")}</span>
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">☁</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${form.ENABLE_GOOGLE_DRIVE === 'true' && isDriveConfigured && !driveError ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                                {form.ENABLE_GOOGLE_DRIVE === 'true' && isDriveConfigured && !driveError ? "CONNECTED" : "ATTENTION REQUIRED"}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Google Drive Integration</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isDriveConfigured && !driveError ? "Google Drive API is connected. Uploaded files are automatically saved to your cloud drive." : "Refresh Token expired. Please update token in Drive Keys."}
                        </p>
                        <button
                            onClick={() => setActiveTab('drive_config')}
                            className="text-xs font-bold text-[#BC5C29] dark:text-[#BC5C29] hover:underline pt-2 inline-block"
                        >
                            {"Configure Keys"} &rarr;
                        </button>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl"></span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BC5C29]/10 text-[#BC5C29] dark:bg-zinc-800 dark:text-[#BC5C29]">
                                EXCEL EXPORT
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Financial Excel Downloads</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {"Export all budget months, debts, credits, and investments directly to Excel sheets."}
                        </p>
                        <button
                            onClick={() => router.push('/export')}
                            className="text-xs font-bold text-[#BC5C29] dark:text-[#BC5C29] hover:underline pt-2 inline-block"
                        >
                            {"Go to Export Center"} &rarr;
                        </button>
                    </div>

                    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl"></span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                {mediaFiles.length} FILES
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Local Upload Storage</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {"View and download images, invoices, and documents saved locally in uploads folder."}
                        </p>
                        <button
                            onClick={() => setActiveTab('media')}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline pt-2 inline-block"
                        >
                            {"Manage Local Files"} &rarr;
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'drive_config' && (
                <div className="space-y-6 animate-fade-in">
                    {message && (
                        <div className={`p-4 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'}`}>
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-zinc-400 mt-2">{"Loading settings..."}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#BC5C29]"></span>
                                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                            ☁ {"Google Drive Cloud Storage Keys"}
                                        </h2>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.ENABLE_GOOGLE_DRIVE === 'true'}
                                            onChange={e => handleChange('ENABLE_GOOGLE_DRIVE', e.target.checked ? 'true' : 'false')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-zinc-600 peer-checked:bg-[#BC5C29]"></div>
                                        <span className="ml-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                            {form.ENABLE_GOOGLE_DRIVE === 'true' ? "Enabled" : "Disabled"}
                                        </span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Google Drive Client ID"}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.GOOGLE_DRIVE_CLIENT_ID}
                                            onChange={e => handleChange('GOOGLE_DRIVE_CLIENT_ID', e.target.value)}
                                            placeholder="559297957142-xxxx.apps.googleusercontent.com"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Google Drive Client Secret"}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.GOOGLE_DRIVE_CLIENT_SECRET}
                                            onChange={e => handleChange('GOOGLE_DRIVE_CLIENT_SECRET', e.target.value)}
                                            placeholder="GOCSPX-xxxxxxxxx"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Google Drive Refresh Token"}
                                        </label>
                                        <input
                                            type="text" value={form.GOOGLE_DRIVE_REFRESH_TOKEN}
                                            onChange={e => handleChange('GOOGLE_DRIVE_REFRESH_TOKEN', e.target.value)}
                                            placeholder="1//04xxxxxxxxxxxxxx"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Google Drive Parent Folder ID (Optional)"}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.GOOGLE_DRIVE_FOLDER_ID}
                                            onChange={e => handleChange('GOOGLE_DRIVE_FOLDER_ID', e.target.value)}
                                            placeholder="e.g. 1A2b3C4d5E6f7G8h9I0j"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-2xs">
                                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                        🔑 {"System Keys & Default Parameters"}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Gold API Key"}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.GOLD_API_KEY}
                                            onChange={e => handleChange('GOLD_API_KEY', e.target.value)}
                                            placeholder="goldapi-xxxxxx"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Default Company Name"}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.DEFAULT_COMPANY}
                                            onChange={e => handleChange('DEFAULT_COMPANY', e.target.value)}
                                            placeholder="ME"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#BC5C29] animate-ping"></span>
                                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                             {"Smart Notifications & Morning Reminders"}
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const { sendBrowserNotification } = await import('@/features/notifications/services/notifications.js');
                                            sendBrowserNotification({
                                                title: 'System Notification',
                                                body: 'This is a test notification from the system.',
                                                url: '/tasks/todo'
                                            });
                                        }}
                                        className="px-3 py-1.5 bg-[#BC5C29]/10 dark:bg-zinc-800 border border-[#BC5C29]/30 dark:border-zinc-700 text-[#BC5C29] rounded-xl text-xs font-bold hover:bg-[#BC5C29]/20 transition"
                                    >
                                        🧪  TEST 
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Morning Summary Time"}
                                        </label>
                                        <input
                                            type="time"
                                            value={form.MORNING_SUMMARY_TIME || '08:00'}
                                            onChange={e => {
                                                handleChange('MORNING_SUMMARY_TIME', e.target.value);
                                                if (typeof window !== 'undefined') localStorage.setItem('morning_summary_time', e.target.value);
                                            }}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                        <p className="text-[11px] text-zinc-500">This time will be used to send your daily morning summary push notification.</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                                            {"Web Push Notifications Status"}
                                        </label>
                                        <select
                                            value={form.ENABLE_NOTIFICATIONS || 'true'}
                                            onChange={e => {
                                                handleChange('ENABLE_NOTIFICATIONS', e.target.value);
                                                if (typeof window !== 'undefined') localStorage.setItem('notifications_enabled', e.target.value);
                                            }}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400"
                                        >
                                            <option value="true">Enabled</option>
                                            <option value="false">Disabled</option>
                                        </select>
                                        <p className="text-[11px] text-zinc-500">Enable this to receive PWA push notifications on your devices.</p>
                                    </div>
                                </div>
                            </div>

                            
                            <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-2xs mt-6">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                             System Notifications & API (Gmail & Telegram)
                                        </h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">Gmail Username</label>
                                        <input
                                            type="text"
                                            value={form.GMAIL_USER || ''}
                                            onChange={e => handleChange('GMAIL_USER', e.target.value)}
                                            placeholder="youremail@gmail.com"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">Gmail App Password</label>
                                        <input
                                            type="text" value={form.GMAIL_APP_PASSWORD || ''}
                                            onChange={e => handleChange('GMAIL_APP_PASSWORD', e.target.value)}
                                            placeholder="16-char app password"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">Telegram Bot Token</label>
                                        <input
                                            type="text" value={form.TELEGRAM_BOT_TOKEN || ''}
                                            onChange={e => handleChange('TELEGRAM_BOT_TOKEN', e.target.value)}
                                            placeholder="BotFather Token"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">Telegram Chat ID (Admin)</label>
                                        <input
                                            type="text"
                                            value={form.TELEGRAM_CHAT_ID || ''}
                                            onChange={e => handleChange('TELEGRAM_CHAT_ID', e.target.value)}
                                            placeholder="Your Chat ID"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-xs font-semibold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                                            <span>{"Saving Settings..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            <span>{"Save All Settings"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {activeTab === 'media' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] space-y-5 shadow-2xs animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#BC5C29] animate-pulse"></span>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide flex items-center gap-2">
                                    <span>☁</span>
                                    <span>{"Google Drive Uploaded Media & Files"}</span>
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#BC5C29]/10 dark:bg-zinc-800 text-[#BC5C29]">
                                        {driveMediaFiles.length}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {"Live files & images stored in your Google Drive cloud account."}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={fetchDriveMedia}
                            disabled={loadingDriveMedia}
                            className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition flex items-center gap-1.5"
                        >
                            <span></span> {"Refresh Drive"}
                        </button>
                    </div>

                    {!isDriveConfigured ? (
                        <div className="py-12 text-center space-y-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 max-w-md mx-auto p-6">
                            <span className="text-3xl">☁</span>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                {"Google Drive Not Configured Yet"}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {"Please enter your Client ID, Client Secret, and Refresh Token in the 'Drive & ENV Keys' tab to start uploading and viewing media on Google Drive."}
                            </p>
                            <button
                                onClick={() => setActiveTab('drive_config')}
                                className="bg-black hover:bg-zinc-900 border border-white/20 text-white px-5 py-2 rounded-full text-xs font-semibold transition"
                            >
                                ⚙ {"Go to Drive Configuration"}
                            </button>
                        </div>
                    ) : loadingDriveMedia ? (
                        <div className="py-12 text-center space-y-2">
                            <div className="inline-block w-6 h-6 border-2 border-[#BC5C29] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-zinc-400">{"Fetching files from Google Drive API..."}</p>
                        </div>
                    ) : driveError ? (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">⚠ Google Drive API Error:</span>
                            </div>
                            <p className="font-mono bg-white/70 dark:bg-black/50 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/60 text-[11px] leading-relaxed">
                                {driveError}
                            </p>

                            {driveError.includes('expired or revoked') && (
                                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2">
                                    <div className="font-bold flex items-center gap-1.5 text-xs">
                                         <span>{"Step-by-step token renewal guide:"}</span>
                                    </div>
                                    <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium leading-relaxed">
                                        <li>{"Open Google OAuth Playground (developers.google.com/oauthplayground)"}</li>
                                        <li>{"Select 'Google Drive API v3' and check 'drive.file' scope."}</li>
                                        <li>{"Click 'Authorize APIs' and log in with your Google Account."}</li>
                                        <li>{"Click 'Exchange authorization code for tokens' and copy the new Refresh Token."}</li>
                                        <li>
                                            <button
                                                onClick={() => setActiveTab('drive_config')}
                                                className="underline font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white"
                                            >
                                                {"Click here to paste the new Refresh Token in Settings."}
                                            </button>
                                        </li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    ) : driveMediaFiles.length === 0 ? (
                        <div className="py-12 text-center space-y-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <span className="text-2xl">📭</span>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {"No files found on Google Drive folder yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {driveMediaFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 space-y-2 hover:border-[#BC5C29] transition overflow-hidden"
                                >
                                    <div className="aspect-square rounded-lg bg-zinc-200 dark:bg-zinc-900 overflow-hidden relative flex items-center justify-center">
                                        {file.mimeType?.startsWith('image/') ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={file.thumbnailUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' fill='%2371717a'%3E%3Crect width='100%25' height='100%25' fill='%2327272a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23a1a1aa' font-family='sans-serif' font-size='14'%3EDrive File%3C/text%3E%3C/svg%3E";
                                                }}
                                            />
                                        ) : (
                                            <span className="text-3xl">📄</span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-zinc-900 dark:text-white truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 font-mono">{file.size}</p>
                                    </div>
                                    <div className="pt-1 flex items-center gap-1.5">
                                        <a
                                            href={file.driveUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-1 rounded-lg bg-[#BC5C29]/10 dark:bg-zinc-800 text-[#BC5C29] text-[10px] font-bold text-center hover:bg-[#BC5C29]/20 transition"
                                        >
                                            👁 {"View"}
                                        </a>
                                        <a
                                            href={file.downloadUrl}
                                            download
                                            className="p-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold hover:bg-zinc-300 transition"
                                            title="Download"
                                        >
                                            ⬇
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

            {activeTab === 'automation' && (
                <div className="space-y-8 animate-fade-in">
                    <SettingsActivityTimeline />
                    <ExportHubTab />
                </div>
            )}

            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'passwords' && <PasswordsTab />}

            {showGlobalLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-scale-in text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase text-red-500 dark:text-red-400">
                                    {t("Terminate All Active Sessions?", "إنهاء جميع الجلسات والخروج من كل الأجهزة؟")}
                                </h3>
                                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                    {t("Security Force Logout", "تسجيل خروج إجباري عام")}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {t(
                                "This will instantly terminate all active sessions across all devices, phones, tablets, and browsers for ALL users. Everyone (including yourself) will be required to log in again.",
                                "سيتم فوراً طرد وتسجيل خروج جميع المستخدمين من كل الأجهزة والهواتف والمتصفحات وإلغاء صلاحية جميع الرموز المفتوحة فوراً. سيتطلب الدخول مجدداً."
                            )}
                        </p>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() => setShowGlobalLogoutModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            >
                                {t("Cancel", "إلغاء")}
                            </button>
                            <button
                                type="button"
                                disabled={isRevoking}
                                onClick={handleGlobalLogout}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-lg disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{isRevoking ? t("Terminating...", "جاري الخروج...") : t("Yes, Logout All Devices", "نعم، خروج من كل الأجهزة")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
