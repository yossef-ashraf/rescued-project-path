"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileCode,
  Calendar,
  Paperclip,
  Users,
  MoreHorizontal,
  Download,
  Plus,
  ArrowRight,
  Edit2,
  X,
  Share2,
  Trash2,
  MessageSquare
} from "lucide-react";

import { cn } from "@/shared/utils/utils.js";
import { useApp } from "@/shared/context/AppContext.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const getStatusBadgeStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('done') || s.includes('won') || s.includes('completed') || s.includes('active') || s.includes('positive') || s.includes('إيجابي') || s.includes('مكتمل')) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  }
  if (s.includes('progress') || s.includes('doing') || s.includes('negotiation') || s.includes('مستمر') || s.includes('تنفيذ')) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  }
  if (s.includes('review') || s.includes('proposal') || s.includes('مراجعة')) {
    return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
  }
  if (s.includes('todo') || s.includes('new') || s.includes('pending') || s.includes('انتظار') || s.includes('جديد')) {
    return "bg-[#BC5C29]/10 text-[#9C4D31] dark:text-[#BC5C29] border-[#BC5C29]/30";
  }
  if (s.includes('lost') || s.includes('error') || s.includes('overdue') || s.includes('عجز') || s.includes('ملغى') || s.includes('hold') || s.includes('معلق')) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
  }
  return "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700";
};

const StatusBadge = ({ status, onStatusChange, onEdit, t }) => {
  if (onStatusChange) {
    return (
      <select
        data-badge-select="true"
        value={status || 'todo'}
        onChange={(e) => onStatusChange(e.target.value)}
        className={cn(
          "font-bold text-xs px-3 py-1 rounded-full border cursor-pointer focus:outline-none transition appearance-none",
          getStatusBadgeStyle(status)
        )}
      >
        <option value="todo">{t ? t("To Do", "قيد الانتظار") : "To Do"}</option>
        <option value="in_progress">{t ? t("In Progress", "قيد التنفيذ") : "In Progress"}</option>
        <option value="review">{t ? t("In Review", "قيد المراجعة") : "In Review"}</option>
        <option value="done">{t ? t("Done", "مكتمل") : "Done"}</option>
      </select>
    );
  }
  return (
    <Badge
      variant="outline"
      onClick={onEdit}
      className={cn("font-bold text-xs px-2.5 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition", getStatusBadgeStyle(status))}
    >
      {status}
    </Badge>
  );
};

const getDisplayName = (item) => {
  if (!item) return "File Attachment";
  let name = item.file_name || item.name || item.filename || item.title || "";
  const path = item.file_path || item.path || item.url || "";

  if (!name || name === 'Attachment' || name === 'file' || name === 'File') {
    if (path && path !== '#') {
      const cleanPath = path.split('?')[0];
      const pathParts = cleanPath.split('/');
      const lastPart = pathParts.pop();
      if (lastPart && lastPart.includes('.')) {
        name = lastPart;
      }
    }
  }
  if (!name || name === 'Attachment' || name === 'file' || name === 'File') {
    name = "File Attachment";
  }
  if (/^\d{10,}_[a-z0-9]{3,6}_/.test(name)) {
    name = name.replace(/^\d{10,}_[a-z0-9]{3,6}_/, '');
  }
  return name;
};

const getFileMeta = (item) => {
  const name = getDisplayName(item).toLowerCase();
  const path = (item?.file_path || item?.path || item?.url || '').toLowerCase();
  const full = `${name} ${path}`;

  if (full.includes('.pdf')) {
    return { ext: 'PDF', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: 'pdf' };
  }
  if (full.includes('.fig') || full.includes('figma')) {
    return { ext: 'FIGMA', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', icon: 'figma' };
  }
  if (full.includes('.doc') || full.includes('.docx') || full.includes('.txt')) {
    return { ext: 'DOC', color: 'text-[#9C4D31] dark:text-[#BC5C29]', bg: 'bg-[#BC5C29]/10 border-[#BC5C29]/30', icon: 'doc' };
  }
  if (full.includes('.jpg') || full.includes('.jpeg') || full.includes('.png') || full.includes('.webp') || full.includes('.svg')) {
    return { ext: 'IMG', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: 'image' };
  }
  if (full.includes('.zip') || full.includes('.rar') || full.includes('.tar') || full.includes('.7z')) {
    return { ext: 'ZIP', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: 'zip' };
  }
  return { ext: 'FILE', color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700', icon: 'default' };
};

const FileIcon = ({ item }) => {
  const meta = getFileMeta(item);
  if (meta.icon === "figma") return <FileCode className={cn("h-5 w-5", meta.color)} />;
  if (meta.icon === "pdf" || meta.icon === "doc") return <FileText className={cn("h-5 w-5", meta.color)} />;
  return <Paperclip className={cn("h-5 w-5", meta.color)} />;
};

export function ProjectDetailView({
  breadcrumbs = [],
  title = "Untitled Details",
  status = "In Progress",
  assignees = [],
  showAssignee = true,
  dateRange = { start: "Today", end: "Ongoing" },
  tags = [],
  description = "",
  attachments = [],
  commentsFeed = [],
  onClose,
  onEdit,
  onStatusChange,
  onShare,
  onDelete,
  onAddComment,
  onUploadFile,
  onDeleteComment,
  onDeleteAttachment,
  newCommentText = "",
  setNewCommentText,
  addingComment = false,
  editLabel,
  deleteLabel,
  customInfo,
  children
}) {
  const { t } = useApp();
  const fileInputRef = React.useRef(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
      }
    },
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 rounded-3xl">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <CardHeader className="p-4 sm:px-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-1.5 min-w-0">
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={index}>
                  <a href={breadcrumb.href || "#"} className="hover:text-zinc-900 dark:hover:text-white transition truncate">
                    {breadcrumb.label}
                  </a>
                  {index < breadcrumbs.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">/</span>}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 px-3.5 text-xs font-bold bg-[#BC5C29] text-white hover:bg-[#9C4D31] border-transparent rounded-full shadow-2xs flex items-center gap-1.5 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>{editLabel || t("Edit Task", "تعديل المهمة")}</span>
                </Button>
              )}
              {onShare && (
                <Button variant="ghost" size="icon" onClick={onShare} className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-zinc-500 hover:text-rose-600 rounded-full" title={deleteLabel || t("Delete Task", "حذف المهمة")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition rounded-full shadow-xs">
                  <X className="h-4 w-4 stroke-[2.5]" />
                </Button>
              )}
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-5 sm:p-8 space-y-6 sm:space-y-8">
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1
                onClick={onEdit}
                className={cn(
                  "text-xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight break-words",
                  onEdit && "cursor-pointer hover:opacity-80 transition group flex items-center gap-2"
                )}
                title={onEdit ? t("Click to edit task", "اضغط لتعديل المهمة") : ""}
              >
                <span>{title}</span>
                {onEdit && (
                  <Edit2 className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition inline-block shrink-0" />
                )}
              </h1>
              {status && (
                <div className="shrink-0">
                  <StatusBadge status={status} onStatusChange={onStatusChange} onEdit={onEdit} t={t} />
                </div>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag, i) => (
                  <Badge key={i} variant={tag.variant || "secondary"} className="text-[10px] font-bold rounded-full px-2.5 py-0.5">
                    {tag.label}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </div>
              <div className="w-full">
                <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider mb-1">{t("Status", "الحالة")}</p>
                <div>
                  <StatusBadge status={status} onStatusChange={onStatusChange} onEdit={onEdit} t={t} />
                </div>
              </div>
            </div>

            {showAssignee && (
              <div className="flex items-start gap-3 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
                <Users className="h-5 w-5 mt-0.5 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider mb-1">{t("Assignee", "المسؤول")}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {assignees.length > 0 ? assignees.map((user, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{user.name}</span>
                      </div>
                    )) : (
                      <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300">{t("User", "المستخدم")}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/60">
              <Calendar className="h-5 w-5 mt-0.5 text-zinc-400 shrink-0" />
              <div className="w-full">
                <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider mb-1">{t("Date Range", "التاريخ والمدة")}</p>
                <p className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 font-mono flex-wrap">
                  <span>{dateRange.start || t("Today", "اليوم")}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400 rtl:rotate-180 shrink-0" />
                  <span>{dateRange.end || t("Ongoing", "مستمر")}</span>
                </p>
              </div>
            </div>

            <div
              onClick={onEdit}
              className={cn(
                "flex items-start gap-3 col-span-1 sm:col-span-2 lg:col-span-3 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/60",
                onEdit && "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition group"
              )}
              title={onEdit ? t("Click to edit task description", "اضغط لتعديل تفاصيل المهمة") : ""}
            >
              <FileText className="h-5 w-5 mt-0.5 text-zinc-400 shrink-0" />
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">{t("Description & Details", "الوصف والتفاصيل")}</p>
                  {onEdit && (
                    <span className="text-[10px] text-zinc-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1">
                      <Edit2 className="h-3 w-3" /> {t("Edit", "تعديل")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap break-words">
                  {description || t("No additional details provided.", "لا توجد تفاصيل إضافية مضافة.")}
                </p>
              </div>
            </div>
          </motion.div>

          {(customInfo || children) && (
            <motion.div variants={itemVariants}>
              {customInfo || children}
            </motion.div>
          )}

          {(attachments.length > 0 || onUploadFile) && (
            <motion.div variants={itemVariants} className="space-y-4 pt-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-zinc-400" />
                  <span>{t("Attachments & Files", "المرفقات والملفات")}</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">{attachments.length}</Badge>
                </h3>
                <div className="flex items-center gap-2">
                  {onUploadFile && (
                    <>
                      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={onUploadFile} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t("Upload File", "رفع ملف")}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file) => {
                    const meta = getFileMeta(file);
                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className={cn("p-2 rounded-xl border shrink-0", meta.bg)}>
                            <FileIcon item={file} />
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{getDisplayName(file)}</p>
                            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className={cn("px-1.5 py-0.5 rounded font-extrabold text-[9px]", meta.bg, meta.color)}>{meta.ext}</span>
                              {file.size && <span>{file.size}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {file.path && file.path !== '#' && (
                            <a href={file.path} target="_blank" rel="noopener noreferrer" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition" title={t("Download", "تحميل")}>
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                          {onDeleteAttachment && (
                            <button type="button" onClick={() => onDeleteAttachment(file.id)} className="p-2 text-zinc-400 hover:text-rose-600 transition cursor-pointer" title={t("Delete", "حذف")}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <span>{t("Comments & Notes Feed", "سجل التعليقات والملاحظات")}</span>
              <Badge variant="secondary" className="text-[10px] font-bold">{commentsFeed.length}</Badge>
            </h3>

            {onAddComment && (
              <div className="space-y-3">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText && setNewCommentText(e.target.value)}
                  placeholder={t("Write a comment or note...", "اكتب تعليقاً أو ملاحظة جديدة حول المهمة...")}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 min-h-[90px]"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={onAddComment}
                    disabled={addingComment || !newCommentText.trim()}
                    className="bg-[#BC5C29] hover:bg-[#9C4D31] text-white text-xs font-bold rounded-xl px-4 py-2 disabled:opacity-50"
                  >
                    {addingComment ? t("Posting...", "جاري النشر...") : t("Post Comment", "إضافة التعليق")}
                  </Button>
                </div>
              </div>
            )}

            {commentsFeed.length > 0 && (
              <div className="space-y-3 pt-2">
                {commentsFeed.map((comment) => (
                  <div key={comment.id} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{comment.author}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-mono text-[10px]">{comment.date}</span>
                        {onDeleteComment && (
                          <button type="button" onClick={() => onDeleteComment(comment.id)} className="p-1 text-zinc-400 hover:text-rose-600 transition cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed whitespace-pre-wrap break-words font-sans">{comment.text}</p>
                    {Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {comment.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.file_path || att.path || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-[#BC5C29] transition"
                          >
                            <Paperclip className="w-3 h-3 text-[#BC5C29] shrink-0" />
                            <span className="truncate max-w-[220px]">{att.file_name || att.name || 'Attachment'}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </CardContent>
      </motion.div>
    </Card>
  );
}

export default ProjectDetailView;
