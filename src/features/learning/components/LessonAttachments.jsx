'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, Plus, Trash2, ExternalLink, UploadCloud, Loader2, CheckCircle2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/shared/context/AppContext.js';
import { uploadFileWithSync } from '@/shared/storage/upload-helper.js';
import { cn } from '@/shared/utils/utils.js';

export function LessonAttachments({ attachments = [], onAdd, onDelete }) {
    const { t, lang } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
    const [fileName, setFileName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            if (!fileName.trim()) {
                setFileName(file.name);
            }
            const res = await uploadFileWithSync(file, {
                entityType: 'lesson_attachment',
                entityName: file.name
            });
            if (res?.url || res?.filePath) {
                const url = res.url || res.filePath;
                setFileUrl(url);
                setUploadedFileInfo({
                    name: file.name,
                    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                    url
                });
            } else {
                throw new Error("Upload did not return a valid URL");
            }
        } catch (err) {
            console.error("Upload failed:", err);
            setError(err.message || t("Upload failed", "فشل الرفع"));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fileName.trim() || !fileUrl.trim()) return;
        if (onAdd) {
            await onAdd({ file_name: fileName.trim(), file_url: fileUrl.trim() });
            setFileName('');
            setFileUrl('');
            setUploadedFileInfo(null);
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-3 p-3.5 bg-surface rounded-2xl border border-line" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <Paperclip className="w-3.5 h-3.5 text-primary" />
                    <span>{t("Lesson Attachments", "مرفقات المحاضرة")} ({attachments.length})</span>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setError('');
                        setUploadedFileInfo(null);
                    }}
                    className="h-7 px-2 text-[11px] gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                >
                    <Plus className="w-3 h-3" />
                    <span>{isAdding ? t("Cancel", "إلغاء") : t("Add Attachment", "إضافة مرفق")}</span>
                </Button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="p-3 bg-surfaceMuted/50 rounded-xl border border-line space-y-3 text-xs">
                    {/* Mode switcher */}
                    <div className="flex p-0.5 bg-surface rounded-lg border border-line text-[11px] font-semibold">
                        <button
                            type="button"
                            onClick={() => setUploadMode('file')}
                            className={cn(
                                'flex-1 py-1 rounded-md transition cursor-pointer flex items-center justify-center gap-1',
                                uploadMode === 'file' ? 'bg-primary/10 text-primary font-bold' : 'text-inkMuted hover:text-ink'
                            )}
                        >
                            <UploadCloud className="w-3 h-3" />
                            <span>{t("Upload File", "رفع ملف")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode('url')}
                            className={cn(
                                'flex-1 py-1 rounded-md transition cursor-pointer flex items-center justify-center gap-1',
                                uploadMode === 'url' ? 'bg-primary/10 text-primary font-bold' : 'text-inkMuted hover:text-ink'
                            )}
                        >
                            <Link2 className="w-3 h-3" />
                            <span>{t("Direct Link", "رابط مباشر")}</span>
                        </button>
                    </div>

                    {error && (
                        <p className="text-[11px] text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>
                    )}

                    {uploadMode === 'file' && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3.5 border border-dashed rounded-xl border-line hover:border-primary text-center cursor-pointer bg-surface/50 transition"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="flex items-center justify-center gap-2 text-primary text-[11px]">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t("Uploading file...", "جاري الرفع...")}</span>
                                </div>
                            ) : uploadedFileInfo ? (
                                <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="font-bold truncate max-w-[180px]">{uploadedFileInfo.name}</span>
                                    <span>({uploadedFileInfo.size})</span>
                                </div>
                            ) : (
                                <div className="space-y-0.5 text-inkMuted">
                                    <UploadCloud className="w-5 h-5 mx-auto text-primary" />
                                    <p className="text-[11px] font-semibold text-ink">{t("Click to select file from device", "انقر لاختيار ملف من جهازك")}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                            {t("File Name or Description", "اسم الملف أو الوصف")}
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder={t("e.g. Lecture Slides PDF", "مثال: سلايدات المحاضرة PDF")}
                            className="w-full text-xs bg-canvas border border-line rounded px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    {uploadMode === 'url' && (
                        <div>
                            <label className="text-[11px] font-semibold text-inkMuted block mb-1">
                                {t("File URL", "رابط الملف")}
                            </label>
                            <input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full text-xs bg-canvas border border-line rounded px-2.5 py-1.5 text-ink focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-1.5 pt-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs cursor-pointer">
                            {t("Cancel", "إلغاء")}
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={uploading || !fileUrl.trim()}
                            className="h-7 text-xs font-semibold cursor-pointer gap-1"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>{t("Uploading...", "جاري الرفع...")}</span>
                                </>
                            ) : (
                                <span>{t("Save Attachment", "حفظ المرفق")}</span>
                            )}
                        </Button>
                    </div>
                </form>
            )}

            {attachments.length === 0 ? (
                <p className="text-[11.5px] text-inkMuted text-center py-2">
                    {t("No attachments added to this lesson yet.", "لا توجد ملفات مرفقة بالمحاضرة بعد.")}
                </p>
            ) : (
                <div className="space-y-1.5">
                    {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 rounded-xl bg-surfaceMuted/40 border border-line text-xs">
                            <span className="font-medium text-ink truncate max-w-[200px]">{att.file_name}</span>
                            <div className="flex items-center gap-1.5">
                                <a
                                    href={att.file_url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="p-1 text-primary hover:bg-primary/10 rounded cursor-pointer"
                                    title={t("Open Attachment", "فتح المرفق")}
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(att.id)}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                        title={t("Delete Attachment", "حذف المرفق")}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LessonAttachments;
