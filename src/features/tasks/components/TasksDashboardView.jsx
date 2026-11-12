'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from '@/shared/next-compat/link';
import { useSearchParams } from '@/shared/next-compat/navigation';
import { TrelloKanbanBoard } from '@/features/tasks/components/TrelloKanbanBoard';
import { ProjectDetailView } from '@/features/operations/components/ProjectDetailView';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import { updateTaskStatusInList } from '@/features/tasks/services/board-reducer.js';
import { useApp } from '@/shared/context/AppContext.jsx';
import { cn } from '@/shared/utils/utils.js';

import {
    fetchTasksList,
    fetchTaskById,
    fetchProjectsList,
    createTask,
    updateTaskDetails,
    updateTaskStatus,
    deleteTask,
    addTaskComment,
    deleteTaskComment,
    addTaskAttachment,
    deleteTaskAttachment,
    uploadTaskFile
} from '@/features/tasks/api/tasks.api.js';
import { filterTasks, calculateTaskCounts, loadActivityLogs, saveActivityLog } from '@/features/tasks/utils/tasks.logic.js';
import { Button } from '@/components/ui/button';

export default function TasksDashboardView() {
    const { t, setActiveDashboard } = useApp();
    const searchParams = useSearchParams();
    const tabParam = searchParams?.get('tab') || 'board';
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('kanban');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedTask, setSelectedTask] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState('todo');
    const [editPriority, setEditPriority] = useState('Medium');
    const [editCompany, setEditCompany] = useState('ME');
    const [editDueDate, setEditDueDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [addingComment, setAddingComment] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: null, title: '', message: '', itemName: '', isDeleting: false });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [dueDate, setDueDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [activityLogs, setActivityLogs] = useState(() => loadActivityLogs());

    const addActivityLog = useCallback((actionText) => {
        setActivityLogs(prev => saveActivityLog(actionText, prev));
    }, []);

    const populateEditFields = (task) => {
        if (!task) return;
        setEditTitle(task.title || '');
        setEditDescription(task.description || '');
        setEditStatus(task.status || 'todo');
        setEditPriority(task.priority || 'Medium');
        setEditCompany(task.company || 'ME');
        setEditDueDate(task.due_date || '');
        setEditEndDate(task.end_date || '');
    };

    const reloadTasks = useCallback(async () => {
        try {
            const data = await fetchTasksList();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        setActiveDashboard('tasks');
        Promise.all([
            fetchTasksList(),
            fetchProjectsList().catch(() => [])
        ])
            .then(([tasksData, projectsData]) => {
                setTasks(Array.isArray(tasksData) ? tasksData : []);
                setProjects(Array.isArray(projectsData) ? projectsData : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [setActiveDashboard]);

    const handleOpenTask = async (task) => {
        setSelectedTask(task);
        populateEditFields(task);
        setIsEditingTask(false);
        setIsDrawerOpen(true);
        try {
            const data = await fetchTaskById(task.id);
            if (data && !data.error) {
                setSelectedTask(data);
                populateEditFields(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditTask = async (task, e) => {
        if (e) e.stopPropagation();
        setSelectedTask(task);
        populateEditFields(task);
        setIsEditingTask(true);
        setIsDrawerOpen(true);
        try {
            const data = await fetchTaskById(task.id);
            if (data && !data.error) {
                setSelectedTask(data);
                populateEditFields(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (e) => {
        if (e) e.preventDefault();
        if (!commentText.trim() || !selectedTask) return;
        setAddingComment(true);
        try {
            const data = await addTaskComment(selectedTask.id, commentText);
            if (data.success) {
                setCommentText('');
                const detailData = await fetchTaskById(selectedTask.id);
                setSelectedTask(detailData);
                reloadTasks();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAddingComment(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTask) return;
        try {
            const uploadData = await uploadTaskFile(file, selectedTask.title || selectedTask.name || file.name);
            if (uploadData.success) {
                await addTaskAttachment(selectedTask.id, {
                    fileName: file.name,
                    filePath: uploadData.filePath || uploadData.url,
                    fileSize: file.size,
                    fileType: file.type
                });
                const detailData = await fetchTaskById(selectedTask.id);
                setSelectedTask(detailData);
                reloadTasks();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTaskAttachment = (attachmentId) => {
        setDeleteModal({
            isOpen: true,
            type: 'attachment',
            id: attachmentId,
            title: t("Delete Attachment", "تأكيد حذف المرفق"),
            message: t("Are you sure you want to delete this attachment?", "هل أنت متأكد من حذف هذا الملف المرفق؟"),
            itemName: '',
            isDeleting: false
        });
    };

    const handleDeleteTaskComment = (commentId) => {
        setDeleteModal({
            isOpen: true,
            type: 'comment',
            id: commentId,
            title: t("Delete Comment", "تأكيد حذف التعليق"),
            message: t("Are you sure you want to delete this comment?", "هل أنت متأكد من حذف هذا التعليق؟"),
            itemName: '',
            isDeleting: false
        });
    };

    const handleSaveTaskDetails = async (e) => {
        if (e) e.preventDefault();
        if (!selectedTask) return;
        setEditSaving(true);
        try {
            const data = await updateTaskDetails({
                taskId: selectedTask.id,
                title: editTitle,
                description: editDescription,
                status: editStatus,
                priority: editPriority,
                company: editCompany,
                due_date: editDueDate || null,
                end_date: editEndDate || null,
                start_date: selectedTask.start_date,
                reminder_time: selectedTask.reminder_time,
                is_recurring: selectedTask.is_recurring,
                repeat_days: selectedTask.repeat_days
            });
            if (data?.success || data?.ok) {
                setTasks(prev => prev.map(t => String(t.id) === String(selectedTask.id) ? {
                    ...t,
                    title: editTitle,
                    description: editDescription,
                    status: editStatus,
                    priority: editPriority,
                    company: editCompany,
                    due_date: editDueDate || null,
                    end_date: editEndDate || null
                } : t));
                reloadTasks();
                fetchProjectsList().then(list => {
                    if (Array.isArray(list)) setProjects(list);
                }).catch(err => console.error(err));
                setSelectedTask(prev => ({
                    ...prev,
                    title: editTitle,
                    description: editDescription,
                    status: editStatus,
                    priority: editPriority,
                    company: editCompany,
                    due_date: editDueDate,
                    end_date: editEndDate
                }));
                setIsEditingTask(false);
                addActivityLog(`Edited details of task "${editTitle}"`);
            } else {
                console.error('Failed to update task:', data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEditSaving(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await createTask({
                title,
                description,
                status,
                due_date: dueDate || null,
                end_date: endDate || null,
                is_daily: 1
            });
            if (data?.success || data?.ok) {
                reloadTasks();
                addActivityLog(`Created new task: "${title}"`);
                setTitle('');
                setDescription('');
                setStatus('todo');
                setDueDate('');
                setEndDate('');
                setIsAddOpen(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            const data = await updateTaskStatus(taskId, newStatus);
            if (data?.success || data?.ok) {
                reloadTasks();
                if (selectedTask?.id === taskId) {
                    setSelectedTask(prev => ({ ...prev, status: newStatus }));
                }
                const taskObj = tasks.find(t => t.id === taskId);
                const taskTitle = taskObj ? taskObj.title : `ISS-${1000 + Number(taskId)}`;
                addActivityLog(`Updated status of "${taskTitle}" to: ${newStatus}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = (taskId) => {
        const tObj = tasks.find(t => String(t.id) === String(taskId));
        setDeleteModal({
            isOpen: true,
            type: 'task',
            id: taskId,
            title: t("Delete Task", "تأكيد حذف المهمة"),
            message: t("Are you sure you want to delete this task? This action cannot be undone.", "هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء."),
            itemName: tObj ? tObj.title : `ISS-${1000 + Number(taskId)}`,
            isDeleting: false
        });
    };

    const executeConfirmedDelete = async () => {
        if (!deleteModal.id) return;
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

        try {
            if (deleteModal.type === 'task') {
                const data = await deleteTask(deleteModal.id);
                if (data?.success || data?.ok) {
                    setTasks(prev => prev.filter(t => String(t.id) !== String(deleteModal.id)));
                    setIsDrawerOpen(false);
                    addActivityLog(`Deleted task ISS-${1000 + Number(deleteModal.id)}`);
                    reloadTasks();
                }
            } else if (deleteModal.type === 'attachment') {
                const data = await deleteTaskAttachment(deleteModal.id);
                if ((data?.success || data?.ok) && selectedTask) {
                    const detailData = await fetchTaskById(selectedTask.id);
                    setSelectedTask(detailData);
                }
            } else if (deleteModal.type === 'comment') {
                const data = await deleteTaskComment(deleteModal.id);
                if ((data?.success || data?.ok) && selectedTask) {
                    const detailData = await fetchTaskById(selectedTask.id);
                    setSelectedTask(detailData);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteModal({ isOpen: false, type: '', id: null, title: '', message: '', itemName: '', isDeleting: false });
            if (typeof window !== 'undefined') {
                requestAnimationFrame(() => window.scrollTo(0, scrollY));
            }
        }
    };

    const isBugTask = useCallback((task) => {
        const typeStr = (task.type || task.category || '').toLowerCase();
        const titleStr = (task.title || '').toLowerCase();
        return typeStr === 'bug' || titleStr.includes('bug');
    }, []);

    const bugTasksCount = useMemo(() => {
        return tasks.filter(isBugTask).length;
    }, [tasks, isBugTask]);

    const filteredTasks = useMemo(() => {
        const base = filterTasks(tasks, statusFilter, searchQuery);
        if (typeFilter === 'bug') {
            return base.filter(isBugTask);
        }
        return base;
    }, [tasks, statusFilter, searchQuery, typeFilter, isBugTask]);

    const taskCounts = useMemo(() => {
        return calculateTaskCounts(tasks);
    }, [tasks]);

    const { todoCount, inProgressCount, reviewCount, doneCount, resolvedCount, delayedCount } = taskCounts;

    const nowDate = useMemo(() => new Date(), []);
    const currentYear = nowDate.getFullYear();
    const currentMonth = nowDate.getMonth();
    const currentDay = nowDate.getDate();
    const todayIsoStr = useMemo(() => {
        return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    }, [currentYear, currentMonth, currentDay]);

    const currentMonthLabel = useMemo(() => {
        return nowDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [nowDate]);

    const daysInCurrentMonth = useMemo(() => {
        return new Date(currentYear, currentMonth + 1, 0).getDate();
    }, [currentYear, currentMonth]);

    const urgentTodayTasks = useMemo(() => {
        return tasks.filter(tItem => {
            const isDone = tItem.status === 'done' || tItem.status === 'completed';
            if (isDone) return false;
            const dueStr = (tItem.due_date || tItem.start_date || '').substring(0, 10);
            const isDueToday = dueStr === todayIsoStr;
            const isUrgentOrActive = tItem.status === 'in_progress' || tItem.priority === 'High' || tItem.priority === 'P1';
            return isDueToday || isUrgentOrActive;
        });
    }, [tasks, todayIsoStr]);

    const monthDayTaskMap = useMemo(() => {
        const map = {};
        const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-`;
        tasks.forEach(tItem => {
            const dateStr = (tItem.due_date || tItem.start_date || '').substring(0, 10);
            if (dateStr.startsWith(monthPrefix)) {
                const dayNum = parseInt(dateStr.substring(8, 10), 10);
                if (!isNaN(dayNum)) {
                    if (!map[dayNum]) map[dayNum] = [];
                    map[dayNum].push(tItem);
                }
            }
        });
        return map;
    }, [tasks, currentYear, currentMonth]);

    if (loading && tasks.length === 0) {
        return <PageDashboardSkeleton kpiCount={4} />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24 w-full">
            {tabParam === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="orbit-task-card space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">🔒 PRIVATE TASKS (تاسكات خاصة)</span>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-emerald-400">
                                    {tasks.filter(t => t.is_private === 1 || t.type === 'private').length}
                                </span>
                                <span className="text-xs text-zinc-400 font-medium">Personal Only</span>
                            </div>
                        </div>

                        <div className="orbit-task-card space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">🌐 PUBLIC TASKS (تاسكات عامة)</span>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-[#BC5C29]">
                                    {tasks.filter(t => t.is_private !== 1 && t.type !== 'private').length}
                                </span>
                                <span className="text-xs text-zinc-400 font-medium">Team &amp; Deliverables</span>
                            </div>
                        </div>

                        <div className="orbit-task-card space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">{t("ACTIVE PROJECTS", "المشاريع النشطة")}</span>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-emerald-500">{projects.length}</span>
                                <Link href="/projects" className="text-xs text-[#BC5C29] hover:underline font-bold">{t("View Projects →", "عرض المشاريع ←")}</Link>
                            </div>
                        </div>

                        <div className="orbit-task-card space-y-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">{t("TODAY'S IMPORTANT NOTES", "ملاحظات اليوم الهامة")}</span>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-amber-500">{urgentTodayTasks.length}</span>
                                <Link href="/notes" className="text-xs text-amber-500 hover:underline font-bold">{t("Notes →", "الملاحظات ←")}</Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📌</span>
                            <div>
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t("Today's Important Note", "ملاحظة اليوم الهامة")}</h4>
                                <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                    {urgentTodayTasks.length > 0
                                        ? `${urgentTodayTasks[0].title}${urgentTodayTasks[0].description ? ` — ${urgentTodayTasks[0].description}` : ''}`
                                        : t("No urgent notes for today.", "لا توجد ملاحظات عاجلة لليوم.")}
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-bold">{t("Important", "هام")}</span>
                    </div>

                    <div className="bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Tasks &amp; Milestones Calendar</h3>
                                    <p className="text-xs text-zinc-400">Monthly schedule of all tasks and deadlines.</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-bold">{currentMonthLabel}</span>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center text-xs">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="font-bold text-zinc-400 py-1 text-[10px] uppercase">{d}</div>
                            ))}
                            {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(day => {
                                const isToday = day === currentDay;
                                const dayTasks = monthDayTaskMap[day] || [];
                                const hasTask = dayTasks.length > 0;
                                return (
                                    <div
                                        key={day}
                                        className={`p-3 rounded-xl border transition flex flex-col justify-between min-h-[65px] ${isToday
                                            ? 'bg-[#BC5C29] border-[#BC5C29] text-white font-bold shadow-sm'
                                            : 'bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        <span className="text-xs font-bold self-end">{day}</span>
                                        {hasTask && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold truncate ${isToday ? 'bg-white/20 text-white' : 'bg-[#BC5C29]/20 text-[#BC5C29]'}`}>
                                                {dayTasks[0].title}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {tabParam !== 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-[#BC5C29] shadow-2xs flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                                    {t("My Tasks", "مهامي الشخصية")}
                                </h1>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                                    {t("These are assigned to you — work them and mark them resolved.", "هذه هي المهام الموكلة إليك — قم بإنجازها وتحديث حالتها أولاً بأول.")}
                                </p>
                            </div>
                        </div>

                        <Button variant="default" size="default" onClick={() => setIsAddOpen(true)} className="cursor-pointer shrink-0">
                            <span className="font-bold text-base leading-none">+</span>
                            <span>{t("Add Daily Task", "إضافة مهمة جديدة")}</span>
                        </Button>
                    </div>

                    {/* Next Action Guidance Banner */}
                    {urgentTodayTasks.length > 0 && (
                        <div className="p-4 rounded-xl border border-[#BC5C29]/30 bg-gradient-to-r from-[#BC5C29]/10 via-[#BC5C29]/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-[#BC5C29] text-white flex items-center justify-center shrink-0 text-sm font-bold">🎯</span>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#BC5C29] block">
                                        {t("Recommended Next Action", "ماذا أفعل الآن؟ (الأولوية العاجلة)")}
                                    </span>
                                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                                        {urgentTodayTasks[0].title}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={() => handleOpenTask(urgentTodayTasks[0])}
                                className="cursor-pointer shrink-0"
                            >
                                {t("Focus Now →", "التركيز عليها الآن ←")}
                            </Button>
                        </div>
                    )}

                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                        <div className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
                            <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {t("Performance Overview", "مؤشرات الأداء والإنجاز")}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono uppercase">YOU · REAL-TIME</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    {tasks.length > 0 ? `${Math.round((resolvedCount / tasks.length) * 100)}%` : '0%'}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{t("On time", "في الموعد")}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                                <div className="text-lg font-black text-rose-600 dark:text-rose-400">{delayedCount}d</div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{t("Overdue", "المتأخرات")}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
                                <div className="text-lg font-black text-[#BC5C29] dark:text-[#BC5C29]">
                                    {tasks.length > 0 ? `${Math.round(((tasks.length - delayedCount) / tasks.length) * 100)}%` : '100%'}
                                </div>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{t("Backlog health", "سلامة المهام")}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${statusFilter === 'all'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("All", "الكل")}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{tasks.length}</span>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('todo')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${statusFilter === 'todo'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("To Do", "قيد الانتظار")}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'todo' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{todoCount}</span>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('in_progress')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${statusFilter === 'in_progress'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("In Progress", "قيد التنفيذ")}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'in_progress' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{inProgressCount}</span>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('review')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${statusFilter === 'review'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("In Review", "المراجعة والاختبار")}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'review' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{reviewCount}</span>
                                </button>

                                <button
                                    onClick={() => setStatusFilter('done')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${statusFilter === 'done'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("Done", "المكتملة")}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === 'done' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{doneCount}</span>
                                </button>
                            </div>

                            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs">
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${viewMode === 'kanban'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    title="Kanban Board View"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                    </svg>
                                    <span>{t("Kanban", "كانبان")}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${viewMode === 'list'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    title="Compact List View"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span>{t("List", "قائمة")}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${viewMode === 'grid'
                                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    title="Grid Cards View"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                                    </svg>
                                    <span>{t("Grid", "شبكة")}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="relative flex-1">
                                <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={t("Search tasks by title or details...", "ابحث برقم المهمة، العنوان، أو الملاحظات...")}
                                    className="orbit-task-input w-full pl-9 pr-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-[10px] font-semibold text-zinc-400 uppercase">TYPE</span>
                                <button
                                    type="button"
                                    onClick={() => setTypeFilter('all')}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 cursor-pointer ${typeFilter === 'all'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("All", "الكل")}</span>
                                    <span className={`px-1 text-[10px] rounded-full ${typeFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>{tasks.length}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTypeFilter('bug')}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 cursor-pointer ${typeFilter === 'bug'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                                        }`}
                                >
                                    <span>{t("Bug", "خطأ")}</span>
                                    <span className="px-1 text-[10px] bg-rose-100 text-rose-600 rounded-full">{bugTasksCount}</span>
                                </button>
                            </div>
                        </div>

                        {filteredTasks.length === 0 ? (
                            <div className="p-8 text-center text-xs text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                {t("No tasks found matching your filter.", "لا توجد مهام مطابقة للشروط الحالية.")}
                            </div>
                        ) : viewMode === 'kanban' ? (
                            <div className="opportunities-board" aria-label={t('Task opportunities board', 'لوحة فرص المهام')}>
                                <TrelloKanbanBoard
                                    columns={[
                                        {
                                            id: 'todo',
                                            title: t('To Do', 'قيد الانتظار'),
                                            tasks: filteredTasks
                                                .filter(t => t.status === 'todo' || !t.status || t.status === 'backlog')
                                                .map(t => ({
                                                    id: String(t.id),
                                                    rawTask: t,
                                                    title: t.title,
                                                    description: t.description || '',
                                                    due_date: t.due_date,
                                                    priority: t.priority,
                                                    labels: [],
                                                    assignee: null
                                                }))
                                        },
                                        {
                                            id: 'in_progress',
                                            title: t('In Progress', 'قيد التنفيذ'),
                                            tasks: filteredTasks
                                                .filter(t => t.status === 'in_progress')
                                                .map(t => ({
                                                    id: String(t.id),
                                                    rawTask: t,
                                                    title: t.title,
                                                    description: t.description || '',
                                                    due_date: t.due_date,
                                                    priority: t.priority,
                                                    labels: [],
                                                    assignee: null
                                                }))
                                        },
                                        {
                                            id: 'review',
                                            title: t('In Review', 'المراجعة والاختبار'),
                                            tasks: filteredTasks
                                                .filter(t => t.status === 'review' || t.status === 'testing' || t.status === 'in_review')
                                                .map(t => ({
                                                    id: String(t.id),
                                                    rawTask: t,
                                                    title: t.title,
                                                    description: t.description || '',
                                                    due_date: t.due_date,
                                                    priority: t.priority,
                                                    labels: [],
                                                    assignee: null
                                                }))
                                        },
                                        {
                                            id: 'done',
                                            title: t('Done', 'المكتملة'),
                                            tasks: filteredTasks
                                                .filter(t => t.status === 'done' || t.status === 'completed')
                                                .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0) || Number(b.id) - Number(a.id))
                                                .map(t => ({
                                                    id: String(t.id),
                                                    rawTask: t,
                                                    title: t.title,
                                                    description: t.description || '',
                                                    due_date: t.due_date,
                                                    priority: t.priority,
                                                    labels: [],
                                                    assignee: null
                                                }))
                                        }
                                    ]}
                                    onCardClick={(task) => handleOpenTask(task.rawTask || task)}
                                    onTaskEdit={(task) => handleEditTask(task.rawTask || task)}
                                    onAddTaskClick={() => setIsAddOpen(true)}
                                    onTaskMove={async (taskId, fromCol, toCol) => {
                                        if (fromCol === toCol) return;
                                        const cleanId = String(taskId).replace(/^task-/, '');
                                        const previousTasks = [...tasks];
                                        setTasks(prev => updateTaskStatusInList(prev, cleanId, toCol));
                                        try {
                                            const res = await updateTaskStatus(cleanId, toCol);
                                            if (res && res.success === false) {
                                                throw new Error(res.message || 'Failed to update task status');
                                            }
                                        } catch (err) {
                                            console.error('Task move failed:', err);
                                            setTasks(previousTasks);
                                            announceMatteAlert({
                                                tone: 'danger',
                                                title: t('Move Failed', 'فشل نقل المهمة'),
                                                message: t('Failed to move task. Previous state was restored.', 'تعذر نقل المهمة على الخادم، تم التراجع عن الحالة السابقة.'),
                                                duration: 5000
                                            });
                                        }
                                    }}
                                    onTaskAdd={async (colId, titleText) => {
                                        try {
                                            const res = await createTask({ title: titleText, status: colId, is_daily: 1 });
                                            if (res?.success) reloadTasks();
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }}
                                    onTaskDelete={handleDeleteTask}
                                />
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {filteredTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleOpenTask(task)}
                                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-pointer space-y-2 shadow-2xs group relative"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-mono font-medium text-zinc-400">ISS-{1000 + Number(task.id)}</span>
                                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={task.status || 'todo'}
                                                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                                    className="orbit-task-select px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase cursor-pointer border border-zinc-200 dark:border-zinc-700 focus:outline-none"
                                                    title={t("Change status", "تغيير الحالة")}
                                                >
                                                    <option value="todo">To Do</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="review">In Review</option>
                                                    <option value="done">Done</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleEditTask(task, e)}
                                                    className="p-1 text-zinc-400 hover:text-amber-500 dark:hover:text-[#BC5C29] rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                    title={t("Edit task", "تعديل المهمة")}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                    className="p-1 text-zinc-400 hover:text-rose-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                    title={t("Delete task", "حذف المهمة")}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition">{task.title}</h3>
                                        {task.description && <p className="text-xs text-zinc-400 line-clamp-2">{task.description}</p>}
                                        <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                                            <span className="flex items-center gap-1.5">
                                                <span>User</span>
                                            </span>
                                            <span>{task.due_date || 'No date'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs mt-2">
                                <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                                    <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="py-3 px-4 w-32">{t("Status", "الحالة")}</th>
                                            <th className="py-3 px-4 w-28">{t("Key", "المعرف")}</th>
                                            <th className="py-3 px-4 min-w-[280px]">{t("Title", "العنوان")}</th>
                                            <th className="py-3 px-4 w-36">{t("Assignee", "المسؤول")}</th>
                                            <th className="py-3 px-4 w-36">{t("Due Date", "الاستحقاق")}</th>
                                            <th className="py-3 px-4 w-24 text-right">{t("Actions", "الإجراءات")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                                        {filteredTasks.map(task => {
                                            const isDone = task.status === 'done' || task.status === 'completed';
                                            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;
                                            const isTitleArabic = /[\u0600-\u06FF]/.test(task.title || '');

                                            return (
                                                <tr
                                                    key={task.id}
                                                    onClick={() => handleOpenTask(task)}
                                                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group"
                                                >
                                                    <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                        <div className="relative inline-block">
                                                            <select
                                                                value={task.status || 'todo'}
                                                                onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                                                className={cn(
                                                                    "appearance-none cursor-pointer pl-2.5 pr-5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border focus:outline-none transition-all shadow-2xs",
                                                                    isDone ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" :
                                                                        task.status === 'in_progress' ? "bg-[#FAF4EF] text-[#BC5C29] dark:bg-zinc-900 dark:text-[#BC5C29] border-[#BC5C29]/30 dark:border-[#BC5C29]/25" :
                                                                            task.status === 'review' ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800" :
                                                                                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
                                                                )}
                                                                title={t("Click to change status", "اضغط لتغيير الحالة")}
                                                            >
                                                                <option value="todo">To Do</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="review">In Review</option>
                                                                <option value="done">Done</option>
                                                            </select>
                                                            <span className="orbit-task-select pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-zinc-400">▾</span>
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-zinc-400 whitespace-nowrap">
                                                        ISS-{1000 + Number(task.id)}
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        <div dir={isTitleArabic ? "rtl" : "ltr"} className="space-y-0.5">
                                                            <div className={cn(
                                                                "text-xs font-bold text-zinc-900 dark:text-white group-hover:text-[#BC5C29] dark:group-hover:text-[#BC5C29] transition-colors",
                                                                isDone && "line-through text-zinc-400 dark:text-zinc-500"
                                                            )}>
                                                                {task.title}
                                                            </div>
                                                            {task.description && (
                                                                <p className="text-[11px] text-zinc-400 line-clamp-1">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-extrabold flex items-center justify-center shadow-2xs">
                                                                YA
                                                            </div>
                                                            <span className="text-xs text-zinc-700 dark:text-zinc-300">User</span>
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        {task.due_date ? (
                                                            <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                                                                <span className={cn(
                                                                    isOverdue ? "text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1" : "text-zinc-600 dark:text-zinc-400"
                                                                )}>
                                                                    {task.due_date}
                                                                    {isOverdue && (
                                                                        <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-sans font-bold">
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-zinc-400 font-normal">--</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleEditTask(task, e)}
                                                                className="p-1 text-zinc-500 hover:text-amber-500 dark:hover:text-[#BC5C29] rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                                title={t("Edit task", "تعديل المهمة")}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenTask(task)}
                                                                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                                                title={t("View task details", "عرض تفاصيل المهمة")}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="p-1 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                                                title={t("Delete task", "حذف المهمة")}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isDrawerOpen && selectedTask && (
                <div
                    className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-center items-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsDrawerOpen(false); }}
                >
                    <div
                        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isEditingTask ? (
                            <div className="bg-white dark:bg-zinc-900 backdrop-blur-2xl rounded-[32px] border border-zinc-200 dark:border-zinc-800 max-w-lg mx-auto w-full p-6 sm:p-7 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-[#BC5C29] text-white flex items-center justify-center shrink-0 shadow-xs">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t("Edit Task Details", "تعديل بيانات المهمة")}</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                ISS-{1000 + Number(selectedTask.id)} — {t("Update task properties, status, and timeline.", "تحديث بيانات وحالة ومواعيد المهمة.")}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingTask(false)}
                                        className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer text-lg font-bold"
                                    >
                                        &times;
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTaskDetails} className="space-y-4 font-sans text-xs">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Task Title", "عنوان المهمة")}</label>
                                        <input
                                            type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                            className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Description & Details", "الوصف والتفاصيل")}</label>
                                        <textarea
                                            value={editDescription} onChange={e => setEditDescription(e.target.value)}
                                            className="orbit-task-textarea w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29] transition leading-relaxed"
                                            rows="3"
                                            placeholder={t("Enter task notes or details...", "أدخل تفاصيل وملاحظات المهمة...")}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Status", "الحالة")}</label>
                                            <select
                                                value={editStatus} onChange={e => setEditStatus(e.target.value)}
                                                className="orbit-task-select w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29] font-semibold cursor-pointer"
                                            >
                                                <option value="todo">{t("To Do", "قيد الانتظار")}</option>
                                                <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                                                <option value="review">{t("In Review", "المراجعة")}</option>
                                                <option value="done">{t("Done", "مكتملة")}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Workspace / Tag", "الوسم أو الشركة")}</label>
                                            <input
                                                type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)}
                                                placeholder="ME / Codex / Client"
                                                className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Start / Due Date", "تاريخ البدء / الاستحقاق")}</label>
                                            <input
                                                type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                                                className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("End Date", "تاريخ الانتهاء")}</label>
                                            <input
                                                type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)}
                                                className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#BC5C29]"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingTask(false)}
                                            className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                        >
                                            {t("Cancel", "إلغاء")}
                                        </button>
                                        <button
                                            type="submit" disabled={editSaving}
                                            className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-[#BC5C29] dark:hover:bg-[#9C4D31] text-white text-xs font-semibold transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {editSaving && (
                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                            )}
                                            <span>{editSaving ? t("Saving Changes...", "جاري الحفظ...") : t("Save Changes", "حفظ التعديلات")}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <ProjectDetailView
                                breadcrumbs={[
                                    { label: t("My Tasks", "مهامي الشخصية"), href: "/tasks" },
                                    { label: `ISS-${1000 + Number(selectedTask.id)}`, href: "#" },
                                ]}
                                title={selectedTask.title || editTitle}
                                status={selectedTask.status || editStatus}
                                showAssignee={false}
                                dateRange={{
                                    start: selectedTask.due_date || "Today",
                                    end: selectedTask.end_date || "Ongoing"
                                }}
                                tags={[
                                    { label: selectedTask.company || editCompany || "ME", variant: "secondary" },
                                    { label: "Task", variant: "outline" }
                                ]}
                                description={selectedTask.description || editDescription || t("No description provided.", "لا توجد تفاصيل إضافية.")}
                                attachments={(selectedTask.attachments || []).map(att => ({
                                    id: att.id,
                                    name: att.file_name || att.name || "File",
                                    path: att.file_path || att.path || "#",
                                    size: att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : "File",
                                    type: (att.file_name || "").endsWith('.pdf') ? 'pdf' : (att.file_name || "").endsWith('.fig') ? 'figma' : 'pdf'
                                }))}
                                commentsFeed={(selectedTask.comments || []).map(c => ({
                                    id: c.id,
                                    author: "Task Note",
                                    date: c.created_at ? String(c.created_at).split('T')[0] : "Today",
                                    text: c.comment || c.text || "Task note"
                                }))}
                                onClose={() => setIsDrawerOpen(false)}
                                onEdit={() => setIsEditingTask(true)}
                                onStatusChange={(newStatus) => handleUpdateStatus(selectedTask.id, newStatus)}
                                onDelete={() => handleDeleteTask(selectedTask.id)}
                                onAddComment={handleAddComment}
                                onUploadFile={handleFileUpload}
                                onDeleteComment={handleDeleteTaskComment}
                                onDeleteAttachment={handleDeleteTaskAttachment}
                                newCommentText={commentText}
                                setNewCommentText={setCommentText}
                                addingComment={addingComment}
                            />
                        )}
                    </div>
                </div>
            )}

            {isAddOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsAddOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-[#BC5C29] text-white flex items-center justify-center shrink-0 shadow-xs text-lg font-bold">
                                    +
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t("Create New Task", "إضافة مهمة جديدة")}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Add a task to your Kanban board with optional start and end dates.", "أضف مهمة جديدة إلى لوحة الكانبان مع تحديد المواعيد.")}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddOpen(false)} className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer text-lg font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4 font-sans text-xs">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Task Title", "عنوان المهمة")}</label>
                                <input
                                    type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                    placeholder={t("Task title...", "عنوان المهمة...")}
                                    className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Description", "الوصف والتفاصيل")}</label>
                                <textarea
                                    value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder={t("Details...", "تفاصيل المهمة...")}
                                    className="orbit-task-textarea w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition leading-relaxed"
                                    rows="3"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("Start / Due Date", "تاريخ الاستحقاق")}</label>
                                    <input
                                        type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t("End Date", "تاريخ الانتهاء")}</label>
                                    <input
                                        type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none transition"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit" disabled={submitting}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-[#BC5C29] dark:hover:bg-[#9C4D31] text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? t("Saving...", "جاري الحفظ...") : t("Save Task", "حفظ المهمة")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                message={deleteModal.message}
                itemName={deleteModal.itemName}
                confirmText={t("Delete", "حذف")}
                cancelText={t("Cancel", "إلغاء")}
                isDeleting={deleteModal.isDeleting}
                onConfirm={executeConfirmedDelete}
                onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
