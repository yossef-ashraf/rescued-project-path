'use client';

import React, { useState, useRef } from 'react';
import Link from '@/shared/next-compat/link';
import { Card } from '@/components/ui/card';
import {
    FileText,
    Download,
    ExternalLink,
    Paperclip,
    Plus,
    Trash2,
    Calendar,
    GraduationCap,
    Check,
    X,
    AlertCircle,
    FileCode,
    Video,
    BookOpen,
    Link2,
    UploadCloud,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import LearningEmptyState from './LearningEmptyState.jsx';
import { useApp } from '@/shared/context/AppContext.js';
import { addLessonAttachment, deleteLessonAttachment } from '@/features/learning/api/lessons.api.js';
import { uploadFileWithSync } from '@/shared/storage/upload-helper.js';
import { cn } from '@/shared/utils/utils.js';

export function CourseMaterialsPanel({
    courseId,
    attachments = [],
    lessons = [],
    onRefresh = () => {}
}) {
    const { t, lang } = useApp();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState(lessons?.[0]?.id ? String(lessons[0].id) : '');
    const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
    const [fileName, setFileName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState('pdf');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const fileInputRef = useRef(null);

    const processFileUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            let detectedType = 'doc';
            if (['.pdf'].includes(ext)) detectedType = 'pdf';
            else if (['.mp4', '.mkv', '.webm', '.mov', '.avi'].includes(ext)) detectedType = 'video';
            else if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.php', '.zip', '.tar', '.gz', '.json', '.sql', '.html', '.css'].includes(ext)) detectedType = 'code';
            else if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)) detectedType = 'doc';
            
            setFileType(detectedType);
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
            console.error("Upload error:", err);
            setError(err.message || t("Failed to upload file.", "فشل رفع الملف."));
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) await processFileUpload(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await processFileUpload(file);
    };

    const handleCreateAttachment = async (e) => {
        e.preventDefault();
        if (!selectedLessonId) {
            setError(t("Please select a target lesson.", "يرجى تحديد المحاضرة المستهدفة."));
            return;
        }
        if (!fileName.trim() || !fileUrl.trim()) {
            setError(t("File name and URL are required.", "اسم الملف ورابط الملف مطلوبان."));
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await addLessonAttachment(selectedLessonId, {
                file_name: fileName.trim(),
                file_url: fileUrl.trim(),
                file_type: fileType,
                description: description.trim() || null
            });
            if (res?.success) {
                setFileName('');
                setFileUrl('');
                setDescription('');
                setIsUploadOpen(false);
                onRefresh();
            } else {
                setError(res?.error?.message || t("Failed to save attachment.", "تعذر حفظ المرفق."));
            }
        } catch (err) {
            setError(err?.message || t("Failed to attach file.", "حدث خطأ أثناء إرفاق الملف."));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!confirm(t("Are you sure you want to delete this attachment?", "هل أنت متأكد من حذف هذا المرفق نهائياً؟"))) {
            return;
        }
        setDeletingId(attachmentId);
        try {
            const res = await deleteLessonAttachment(attachmentId);
            if (res?.success) {
                onRefresh();
            }
        } catch (err) {
            console.error("Failed to delete attachment:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (type) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
        if (lower.includes('code') || lower.includes('json') || lower.includes('js')) return <FileCode className="w-5 h-5 text-amber-500" />;
        if (lower.includes('video') || lower.includes('mp4')) return <Video className="w-5 h-5 text-emerald-500" />;
        if (lower.includes('link')) return <Link2 className="w-5 h-5 text-primary" />;
        return <BookOpen className="w-5 h-5 text-blue-500" />;
    };

    return (
        <div className="space-y-4 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Action Bar Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-line shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Paperclip className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-ink">
                                {t("Lesson Attachments & Resources", "مرفقات وملفات المحاضرات")}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {attachments.length} {t("files", "ملفات")}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surfaceMuted text-inkMuted border border-line font-mono">
                                learning_lesson_attachments
                            </span>
                        </div>
                        <p className="text-[11.5px] text-inkMuted">
                            {t("Files, slides, and references strictly bound to this course's lessons.", "الملفات والشرائح والمراجع المرتبطة بمحاضرات هذا الكورس.")}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setIsUploadOpen(true);
                        if (!selectedLessonId && lessons?.[0]?.id) {
                            setSelectedLessonId(String(lessons[0].id));
                        }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t("Attach File to Lesson", "إرفاق ملف بمحاضرة")}</span>
                </button>
            </div>

            {/* Upload Attachment Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-line pb-3">
                            <div className="flex items-center gap-2 font-bold text-ink text-sm">
                                <Paperclip className="w-4 h-4 text-primary" />
                                <span>{t("Attach File to Course Lesson", "إرفاق ملف بمحاضرة")}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUploadOpen(false)}
                                className="p-1 rounded-lg hover:bg-surfaceMuted text-inkMuted hover:text-ink transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateAttachment} className="space-y-4 text-xs">
                            {/* Segmented Mode Switcher */}
                            <div className="flex p-1 bg-surfaceMuted rounded-xl border border-line text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('file')}
                                    className={cn(
                                        'flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5',
                                        uploadMode === 'file'
                                            ? 'bg-surface text-primary shadow-xs font-bold border border-line'
                                            : 'text-inkMuted hover:text-ink'
                                    )}
                                >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>{t("Upload File from Device", "رفع ملف من الجهاز")}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMode('url')}
                                    className={cn(
                                        'flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5',
                                        uploadMode === 'url'
                                            ? 'bg-surface text-primary shadow-xs font-bold border border-line'
                                            : 'text-inkMuted hover:text-ink'
                                    )}
                                >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span>{t("Direct Link / URL", "رابط خارجي أو مباشر")}</span>
                                </button>
                            </div>

                            {/* File Upload Dropzone (When in file mode) */}
                            {uploadMode === 'file' && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        'p-5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none',
                                        isDragging
                                            ? 'border-primary bg-primary/10'
                                            : uploadedFileInfo
                                            ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                                            : 'border-line hover:border-primary/50 hover:bg-surfaceMuted/50'
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {uploading ? (
                                        <div className="py-3 flex flex-col items-center gap-2 text-primary">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <span className="font-bold text-xs">{t("Uploading & syncing file...", "جاري رفع الملف ومزامنته...")}</span>
                                        </div>
                                    ) : uploadedFileInfo ? (
                                        <div className="py-1 flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                            <span className="font-bold text-xs text-ink">{uploadedFileInfo.name}</span>
                                            <span className="text-[11px] text-inkMuted font-mono">
                                                {uploadedFileInfo.size} • {t("Ready to attach", "تم الرفع بنجاح وجاهز للإرفاق")}
                                            </span>
                                            <span className="text-[10.5px] text-primary underline mt-1 cursor-pointer">
                                                {t("Click to choose another file", "انقر لاختيار ملف آخر")}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-ink text-xs">
                                                    {t("Click to browse or drop file here", "انقر لاختيار ملف من جهازك أو اسحب وأفلت هنا")}
                                                </p>
                                                <p className="text-[11px] text-inkMuted">
                                                    {t("PDF, Video, Documents, Code, Zip, Images (Max 15MB)", "يدعم PDF، الفيديو، المستندات، الأكواد، والملفات المضغوطة")}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="font-semibold text-ink">
                                    {t("Target Lesson", "المحاضرة المستهدفة")} <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={selectedLessonId}
                                    onChange={(e) => setSelectedLessonId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-line bg-surfaceMuted text-ink text-xs focus:outline-none focus:border-primary"
                                    required
                                >
                                    {lessons.length === 0 ? (
                                        <option value="">{t("No lessons in this course yet", "لا توجد محاضرات مضافة لهذا الكورس بعد")}</option>
                                    ) : (
                                        lessons.map((lesson) => (
                                            <option key={lesson.id} value={lesson.id}>
                                                {t("Lesson", "محاضرة")} {lesson.lesson_number}: {lesson.title}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-ink">
                                    {t("File / Resource Name", "اسم الملف أو المورد")} <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder={t("e.g. Lecture Slides, Cheat Sheet, Source Code", "مثال: شرائح المحاضرة، كود التدريب، ملخص PDF")}
                                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-ink">
                                        {t("File Type", "نوع الملف")}
                                    </label>
                                    <select
                                        value={fileType}
                                        onChange={(e) => setFileType(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-primary"
                                    >
                                        <option value="pdf">PDF Document</option>
                                        <option value="link">Web Link / Repository</option>
                                        <option value="code">Code / Project Files</option>
                                        <option value="video">Video Recording</option>
                                        <option value="doc">General Document</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-ink">
                                        {t("File URL / Download Link", "رابط التحميل أو الملف")} <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                        placeholder={uploadMode === 'file' ? t("Auto-filled when file is uploaded", "يتم ملؤه تلقائياً عند رفع الملف") : "https://... or /uploads/..."}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs font-mono focus:outline-none focus:border-primary"
                                        dir="ltr"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-ink">
                                    {t("Description / Note (Optional)", "وصف أو ملاحظة توضيحية (اختياري)")}
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t("Brief description of what this attachment covers...", "وصف موجز لمحتوى الملف وما يغطيه...")}
                                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-xs focus:outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(false)}
                                    className="px-3.5 py-1.5 rounded-xl border border-line bg-surface hover:bg-surfaceMuted text-ink text-xs font-medium transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || uploading || lessons.length === 0 || !fileUrl.trim()}
                                    className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>{t("Uploading...", "جاري الرفع...")}</span>
                                        </>
                                    ) : loading ? (
                                        <span>{t("Attaching...", "جاري الحفظ...")}</span>
                                    ) : (
                                        <span>{t("Save Attachment", "حفظ المرفق")}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attachments List */}
            {attachments.length === 0 ? (
                <LearningEmptyState
                    title={t("No lesson attachments yet", "لا توجد مرفقات محاضرات لهذا الكورس بعد")}
                    description={t(
                        "Attachments added here or inside the lesson workspace will be listed and mapped to their respective lessons.",
                        "المرفقات التي تتم إضافتها هنا أو داخل محرر المحاضرة تُحفظ مباشرة في learning_lesson_attachments وترتبط بدروسها."
                    )}
                    icon={Paperclip}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {attachments.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-line bg-surface hover:border-lineStrong transition-colors flex items-start justify-between gap-3 shadow-2xs group"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surfaceMuted border border-line flex items-center justify-center shrink-0 mt-0.5">
                                    {getFileIcon(item.file_type)}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors">
                                            {item.file_name}
                                        </h4>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold uppercase">
                                            {item.file_type || 'file'}
                                        </span>
                                    </div>

                                    {/* Linked Lesson Badge */}
                                    {item.lesson ? (
                                        <Link
                                            href={`/courses/${courseId}/lessons/${item.lesson_id}`}
                                            className="inline-flex items-center gap-1 text-[11px] text-inkSecondary hover:text-primary transition-colors font-medium hover:underline"
                                            title={t("Open this lesson", "فتح هذه المحاضرة")}
                                        >
                                            <GraduationCap className="w-3 h-3 text-primary shrink-0" />
                                            <span>
                                                {t("Lesson", "محاضرة")} {item.lesson.lesson_number}: {item.lesson.title}
                                            </span>
                                        </Link>
                                    ) : (
                                        <span className="text-[11px] text-inkMuted font-mono">
                                            Lesson #{item.lesson_id}
                                        </span>
                                    )}

                                    {item.description && (
                                        <p className="text-[11.5px] text-inkMuted line-clamp-2 leading-relaxed">
                                            {item.description}
                                        </p>
                                    )}

                                    {item.created_at && (
                                        <div className="flex items-center gap-1 text-[10px] text-inkMuted pt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {item.file_url && (
                                    <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="p-2 rounded-xl border border-line bg-surfaceMuted/40 hover:bg-surfaceMuted text-inkMuted hover:text-primary transition-colors cursor-pointer"
                                        title={t("Open or Download File", "فتح أو تحميل الملف")}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(item.id)}
                                    disabled={deletingId === item.id}
                                    className="p-2 rounded-xl border border-line hover:border-destructive/30 hover:bg-destructive/10 text-inkMuted hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                                    title={t("Delete Attachment", "حذف المرفق")}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CourseMaterialsPanel;
