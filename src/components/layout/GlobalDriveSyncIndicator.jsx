'use client';

import React from 'react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { Loader2, CheckCircle2, AlertCircle, Cloud, ArrowUpCircle } from 'lucide-react';

export default function GlobalDriveSyncIndicator() {
    const { driveSync, t, lang } = useApp();

    if (!driveSync || !driveSync.active) return null;

    const isUploading = driveSync.stage === 'uploading' || driveSync.stage === 'syncing';
    const isCompleted = driveSync.stage === 'completed';
    const isError = driveSync.stage === 'error';

    return (
        <div
            className={`fixed bottom-6 z-[9999] pointer-events-auto transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-5 ${
                lang === 'ar' ? 'left-6' : 'right-6'
            } max-w-sm w-full`}
        >
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-2xl space-y-3 text-zinc-900 dark:text-white">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl shrink-0 mt-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {isUploading && (
                            <Loader2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                        )}
                        {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {isError && (
                            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span>{isUploading ? '☁️' : isCompleted ? '✅' : '⚠️'}</span>
                                <span>
                                    {isUploading && (driveSync.message || t("Uploading & Syncing with Drive...", "جاري الرفع والمزامنة مع Google Drive..."))}
                                    {isCompleted && (driveSync.message || t("Upload & Drive Sync Complete!", "تم الرفع والمزامنة بنجاح مع الدرايف!"))}
                                    {isError && (driveSync.message || t("Sync Failed (Saved Locally)", "فشلت المزامنة (تم الحفظ محلياً)"))}
                                </span>
                            </h4>
                        </div>

                        {driveSync.filename && (
                            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate" title={driveSync.filename}>
                                📄 {driveSync.filename}
                            </p>
                        )}

                        {isUploading && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <span>⏳</span>
                                <span>{t("Please wait, do not close this page...", "يرجى الانتظار، برجاء عدم إغلاق الصفحة...")}</span>
                            </p>
                        )}
                    </div>
                </div>

                {isUploading && (
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full animate-pulse transition-all duration-300"
                            style={{ width: `${Math.max(driveSync.progress || 35, 15)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
