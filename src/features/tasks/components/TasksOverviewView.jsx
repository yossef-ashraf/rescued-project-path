'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from '@/shared/next-compat/link';
import { useApp } from '@/shared/context/AppContext.js';
import ProductivityHeatmap from '@/components/shared/ProductivityHeatmap';
import { cn } from '@/shared/utils/utils.js';
import {
    CheckCircle2,
    Clock,
    CheckSquare,
    ListTodo,
    Trash2,
    ExternalLink,
    Sparkles,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus,
    Edit3,
    Save,
    X
} from 'lucide-react';

import {
    fetchOverviewTasks,
    fetchOverviewNotes,
    fetchOverviewTodos,
    fetchOverviewCourses,
    createOverviewTask,
    updateOverviewTaskDetails,
    updateOverviewTaskStatus,
    deleteOverviewTask
} from '@/features/tasks/api/tasksOverview.api.js';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import PeriodSelector, { getPeriodRange, isInPeriod } from '@/components/ui/PeriodSelector';
import { PageDashboardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/button';
import {
    format3DaysEndDate,
    getTaskBarPosition,
    calculateTodayPositionPercent,
    filterOverviewTasks,
    getSourceTag
} from '@/features/tasks/utils/tasksOverview.logic.js';

const extractArray = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.rows)) return res.rows;
    if (Array.isArray(res?.tasks)) return res.tasks;
    if (Array.isArray(res?.notes)) return res.notes;
    if (Array.isArray(res?.todos)) return res.todos;
    if (Array.isArray(res?.courses)) return res.courses;
    return [];
};

export default function TasksOverviewView() {
    const { t, setActiveDashboard } = useApp();
    const [tasks, setTasks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [todos, setTodos] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [granularity, setGranularity] = useState('days');
    const [selectedMonthDate, setSelectedMonthDate] = useState(() => new Date());
    const [statsPeriod, setStatsPeriod] = useState('month');

    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const [selectedTask, setSelectedTask] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newStatus, setNewStatus] = useState('todo');
    const [newPriority, setNewPriority] = useState('P2');
    const [newDueDate, setNewDueDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);

    const [isEditingInDrawer, setIsEditingInDrawer] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState('todo');
    const [editPriority, setEditPriority] = useState('P2');
    const [editDueDate, setEditDueDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deleteModalState, setDeleteModalState] = useState({
        isOpen: false,
        taskId: null,
        taskTitle: '',
        isDeleting: false
    });

    useEffect(() => {
        setActiveDashboard('tasks');
        Promise.all([
            fetchOverviewTasks().catch(() => []),
            fetchOverviewNotes().catch(() => []),
            fetchOverviewTodos().catch(() => []),
            fetchOverviewCourses().catch(() => [])
        ])
            .then(([tasksData, notesData, todosData, coursesData]) => {
                setTasks(extractArray(tasksData));
                setNotes(extractArray(notesData));
                setTodos(extractArray(todosData));
                setCourses(extractArray(coursesData));
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading overview data:', err);
                setLoading(false);
            });
    }, [setActiveDashboard]);

    const handleOpenDrawer = (task) => {
        setSelectedTask(task);
        setIsEditingInDrawer(false);
        setEditTitle(task.title || '');
        setEditDescription(task.description || '');
        setEditStatus(task.status === 'pending' ? 'todo' : (task.status === 'completed' ? 'done' : (task.status || 'todo')));
        setEditPriority(task.priority || 'P2');
        setEditDueDate(task.due_date || task.start_date || '');
        setEditEndDate(task.end_date || '');
        setIsDrawerOpen(true);
    };

    const handleOpenAddModal = () => {
        setNewTitle('');
        setNewDescription('');
        setNewStatus('todo');
        setNewPriority('P2');
        setNewDueDate(new Date().toISOString().split('T')[0]);
        setNewEndDate('');
        setIsAddModalOpen(true);
    };

    const handleCreateTask = async (e) => {
        if (e) e.preventDefault();
        if (!newTitle.trim()) return;

        setIsSubmittingTask(true);
        try {
            const dueDateVal = newDueDate || new Date().toISOString().split('T')[0];
            const endDateVal = newEndDate || dueDateVal;
            const payload = {
                title: newTitle.trim(),
                description: newDescription.trim() || null,
                status: newStatus,
                priority: newPriority,
                due_date: dueDateVal,
                end_date: endDateVal,
                company: 'ME'
            };

            const res = await createOverviewTask(payload);
            const createdId = res?.id || res?.data?.id || Date.now();
            const createdTask = {
                ...payload,
                id: createdId,
                start_date: dueDateVal,
                created_at: new Date().toISOString()
            };

            setTasks(prev => [createdTask, ...prev]);
            setIsAddModalOpen(false);
            setNewTitle('');
            setNewDescription('');
        } catch (err) {
            console.error('Failed to create task:', err);
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleSaveTaskDetails = async (e) => {
        if (e) e.preventDefault();
        if (!selectedTask || !editTitle.trim()) return;

        setIsSavingEdit(true);
        try {
            const payload = {
                taskId: selectedTask.id,
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                status: editStatus,
                priority: editPriority,
                due_date: editDueDate || null,
                end_date: editEndDate || null,
                company: selectedTask.company || 'ME'
            };

            await updateOverviewTaskDetails(payload);

            setTasks(prev => prev.map(t => String(t.id) === String(selectedTask.id) ? {
                ...t,
                ...payload,
                start_date: editDueDate || t.start_date
            } : t));

            setSelectedTask(prev => ({
                ...prev,
                ...payload,
                start_date: editDueDate || prev.start_date
            }));

            setIsEditingInDrawer(false);
        } catch (err) {
            console.error('Failed to update task details:', err);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setActionLoading(true);
        try {
            await updateOverviewTaskStatus(taskId, newStatus);
            setTasks(prev => prev.map(t => String(t.id) === String(taskId) ? { ...t, status: newStatus } : t));
            if (selectedTask && String(selectedTask.id) === String(taskId)) {
                setSelectedTask(prev => ({ ...prev, status: newStatus }));
                setEditStatus(newStatus);
            }
        } catch (err) {
            console.error('Failed to update task status:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestDelete = (taskId, taskTitle) => {
        setDeleteModalState({
            isOpen: true,
            taskId,
            taskTitle: taskTitle || '',
            isDeleting: false
        });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.taskId) return;
        setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

        try {
            await deleteOverviewTask(deleteModalState.taskId);
            setTasks(prev => prev.filter(t => String(t.id) !== String(deleteModalState.taskId)));
            if (selectedTask && String(selectedTask.id) === String(deleteModalState.taskId)) {
                setIsDrawerOpen(false);
                setSelectedTask(null);
            }
            setDeleteModalState({ isOpen: false, taskId: null, taskTitle: '', isDeleting: false });
        } catch (err) {
            console.error('Failed to delete task:', err);
            setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const monthNames = useMemo(() => [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ], []);
    const dayAbbrs = useMemo(() => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], []);

    const windowMonths = useMemo(() => {
        const curYear = selectedMonthDate.getFullYear();
        const curMonth = selectedMonthDate.getMonth();
        const start = new Date(curYear, curMonth - 5, 1);
        const list = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const y = d.getFullYear();
            const m = d.getMonth();
            const q = `Q${Math.floor(m / 3) + 1} ${String(y).slice(-2)}`;
            list.push({
                label: monthNames[m].slice(0, 3),
                year: y,
                quarter: q,
                monthIndex: m,
                date: d
            });
        }
        return list;
    }, [selectedMonthDate, monthNames]);

    const startDateWindow = useMemo(() => {
        return windowMonths[0]?.date || new Date(new Date().getFullYear(), 0, 1);
    }, [windowMonths]);

    const selYear = selectedMonthDate.getFullYear();
    const selMonth = selectedMonthDate.getMonth();
    const daysInSelMonth = new Date(selYear, selMonth + 1, 0).getDate();

    const weeksHeader = useMemo(() => [
        { label: `Week 1 (1 - 7)`, startDay: 1, endDay: 7 },
        { label: `Week 2 (8 - 14)`, startDay: 8, endDay: 14 },
        { label: `Week 3 (15 - 21)`, startDay: 15, endDay: 21 },
        { label: `Week 4 (22 - 28)`, startDay: 22, endDay: 28 },
        { label: `Week 5 (29 - ${daysInSelMonth})`, startDay: 29, endDay: daysInSelMonth },
    ], [daysInSelMonth]);

    const daysHeader = useMemo(() => {
        const arr = [];
        for (let d = 1; d <= daysInSelMonth; d++) {
            const dateObj = new Date(selYear, selMonth, d);
            const dayOfWeek = dayAbbrs[dateObj.getDay()];
            arr.push({ dayNum: d, dayOfWeek });
        }
        return arr;
    }, [daysInSelMonth, selYear, selMonth, dayAbbrs]);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const todayPositionPercent = useMemo(() => {
        return calculateTodayPositionPercent(granularity, startDateWindow, selMonth, selYear, daysInSelMonth);
    }, [granularity, startDateWindow, selMonth, selYear, daysInSelMonth]);

    const filteredTasks = useMemo(() => {
        return filterOverviewTasks(tasks, searchQuery, teamFilter, statusFilter, priorityFilter);
    }, [tasks, searchQuery, teamFilter, statusFilter, priorityFilter]);

    const formattedTasksList = useMemo(() => {
        return filteredTasks.map(t => {
            const startDate = t.due_date || t.start_date || todayStr;
            const endDate = format3DaysEndDate(startDate, t.end_date);
            return {
                ...t,
                start_date: startDate,
                due_date: startDate,
                end_date: endDate,
                company: 'ME'
            };
        });
    }, [filteredTasks, todayStr]);

    const allTimelineItems = useMemo(() => {
        const rawItems = formattedTasksList;

        const visibleItems = rawItems.filter(item => {
            if (granularity === 'months') return true;

            const sDate = new Date(item.due_date || item.start_date || todayStr);
            const eDate = new Date(item.end_date || item.due_date || sDate);

            const selStart = new Date(selYear, selMonth, 1);
            const selEnd = new Date(selYear, selMonth, daysInSelMonth, 23, 59, 59);

            return (sDate <= selEnd && eDate >= selStart);
        });

        const itemsWithLane = [];
        const laneEndDates = [];

        visibleItems.forEach(item => {
            const sDate = new Date(item.due_date || item.start_date || todayStr);
            const eDate = new Date(item.end_date || item.due_date || sDate);

            let assignedLane = -1;
            for (let i = 0; i < laneEndDates.length; i++) {
                if (sDate >= laneEndDates[i]) {
                    assignedLane = i;
                    laneEndDates[i] = eDate;
                    break;
                }
            }

            if (assignedLane === -1) {
                assignedLane = laneEndDates.length;
                laneEndDates.push(eDate);
            }

            itemsWithLane.push({ ...item, laneIndex: assignedLane });
        });

        return { items: itemsWithLane, totalLanes: Math.max(1, laneEndDates.length) };
    }, [formattedTasksList, granularity, selMonth, selYear, daysInSelMonth, todayStr]);

    const statsPeriodRange = useMemo(() => getPeriodRange(statsPeriod), [statsPeriod]);

    const kpiStats = useMemo(() => {
        const inRange = (dateStr) => isInPeriod(dateStr, statsPeriodRange);

        const periodTasks = tasks.filter(t => inRange(t.due_date || t.start_date || t.created_at));
        const periodTodos = todos.filter(td => inRange(td.due_date || td.created_at));

        const totalTasks = periodTasks.length;
        const totalNotes = notes.filter(n => inRange(n.created_at)).length;
        const doneTasks = periodTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const inProgressTasks = periodTasks.filter(t => t.status === 'in_progress').length;
        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        const totalTodos = periodTodos.length;
        const doneTodos = periodTodos.filter(td => td.status === 'done' || td.completed || td.done === 1 || td.done === true).length;

        return { totalTasks, totalNotes, doneTasks, inProgressTasks, completionRate, totalTodos, doneTodos };
    }, [tasks, notes, todos, statsPeriodRange]);

    const getTaskCardStyle = (task) => {
        if (task.status === 'done' || task.status === 'completed') {
            return {
                borderClass: 'border-l-4 border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50',
                badgeTextClass: 'font-black text-emerald-600 dark:text-emerald-400',
                tagTextClass: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
                label: 'DONE'
            };
        }

        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
        if (isOverdue) {
            return {
                borderClass: 'border-l-4 border-l-rose-500 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50',
                badgeTextClass: 'font-black text-rose-600 dark:text-rose-400',
                tagTextClass: 'text-rose-600 dark:text-rose-400 font-extrabold',
                label: 'OVERDUE'
            };
        }

        return {
            borderClass: 'border-l-4 border-l-blue-500 bg-[#BC5C29]/10/70 dark:bg-[#BC5C29]/10 border border-[#BC5C29]/30 dark:border-[#BC5C29]/25/50',
            badgeTextClass: 'font-black text-[#BC5C29] dark:text-[#BC5C29]',
            tagTextClass: 'text-[#BC5C29] dark:text-[#BC5C29] font-extrabold',
            label: task.priority || 'P2'
        };
    };

    const getAvatarInitials = (idx) => {
        const avatars = ["ME", "ME", "ME", "YA"];
        return avatars[idx % avatars.length];
    };

    const getAvatarBg = (idx) => {
        const bgs = [
            "bg-black text-white border border-white/20",
            "bg-emerald-600 text-white",
            "bg-rose-600 text-white",
            "bg-amber-600 text-white"
        ];
        return bgs[idx % bgs.length];
    };

    const getProgressPercent = (task) => {
        if (task.status === 'done' || task.status === 'completed') return '100%';
        if (task.status === 'in_progress') return '60%';
        return '0%';
    };

    const nextPriorityTask = useMemo(() => {
        const pending = tasks.filter(tItem => tItem.status !== 'done' && tItem.status !== 'completed');
        if (pending.length === 0) return null;
        return [...pending].sort((a, b) => {
            const pOrder = { P1: 1, High: 1, P2: 2, Medium: 2, P3: 3, Low: 3 };
            const pa = pOrder[a.priority] || 2;
            const pb = pOrder[b.priority] || 2;
            if (pa !== pb) return pa - pb;
            return String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'));
        })[0];
    }, [tasks]);

    if (loading && tasks.length === 0 && notes.length === 0) {
        return <PageDashboardSkeleton kpiCount={4} />;
    }

    return (
        <div className="space-y-6 animate-fade-in pb-24 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <Sparkles className="w-6 h-6 text-[#BC5C29]" />
                        <span>{t("Tasks Roadmap & ME Overview", "لوحة المهام والمسار الزمني الشامل")}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Unified roadmap timeline, cross-source tasks, and daily productivity heatmaps.", "إحداثيات المسار الزمني، المهام والملاحظات الموحدة، ومخطط النشاط اليومي.")}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button variant="default" size="default" onClick={handleOpenAddModal} className="cursor-pointer">
                        <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                        <span>{t("New Task", "إضافة مهمة")}</span>
                    </Button>
                    <Button variant="secondary" size="default" asChild className="cursor-pointer">
                        <Link href="/tasks">
                            <ListTodo className="w-3.5 h-3.5 shrink-0 text-primary" />
                            <span>{t("Tasks Board", "لوحة المهام")}</span>
                        </Link>
                    </Button>
                    <Button variant="secondary" size="default" asChild className="cursor-pointer">
                        <Link href="/tasks/todo">
                            <CheckSquare className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span>{t("Daily To-Do", "قائمة To-Do اليومية")}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Next Priority Action Banner ("ماذا أفعل الآن؟") */}
            <div className="p-4 rounded-xl border border-[#BC5C29]/30 bg-gradient-to-r from-[#BC5C29]/10 via-[#BC5C29]/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#BC5C29] text-white flex items-center justify-center shrink-0 font-bold text-sm">
                        ⚡
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#BC5C29]">
                                {t("What to focus on now?", "ماذا أفعل الآن؟ (الأولوية القادمة)")}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                {kpiStats.completionRate}% {t("Done", "منجز")}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                            {nextPriorityTask
                                ? `${nextPriorityTask.title} (${nextPriorityTask.priority || 'P2'})`
                                : t("All scheduled tasks are complete! Add a new milestone to keep momentum.", "جميع المهام المجدولة مكتملة! أضف مهمة جديدة للحفاظ على الزخم.")}
                        </p>
                    </div>
                </div>
                {nextPriorityTask && (
                    <Button
                        variant="secondary"
                        size="default"
                        onClick={() => handleOpenDrawer(nextPriorityTask)}
                        className="cursor-pointer shrink-0"
                    >
                        {t("Open & Start →", "فتح والبدء الآن ←")}
                    </Button>
                )}
            </div>

            <PeriodSelector
                value={statsPeriod}
                onChange={setStatsPeriod}
                t={t}
                label={t('Stats Period', 'فترة الإحصائيات')}
            />

            <div id="tasks-stats" data-component="tasks-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Total Tasks", "إجمالي المهام")}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-zinc-900 dark:text-white">{kpiStats.totalTasks}</span>
                            <span className="text-[10px] font-bold text-zinc-400">({kpiStats.totalTasks} {t("tasks", "مهمة")})</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ListTodo className="w-4 h-4" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("In Progress", "قيد التنفيذ")}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{kpiStats.inProgressTasks}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{t("active", "نشطة")}</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Completed Rate", "نسبة الإنجاز")}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{kpiStats.completionRate}%</span>
                            <span className="text-[10px] font-bold text-zinc-400">({kpiStats.doneTasks}/{kpiStats.totalTasks || 1})</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>

                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{t("Daily To-Dos", "إنجاز مهام اليوم")}</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{kpiStats.doneTodos} / {kpiStats.totalTodos}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{t("done", "منجز")}</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <CheckSquare className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#1A1A1A] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold shrink-0">
                    <div className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#BC5C29]" />
                        <span>{t("Roadmap Timeline", "الخريطة الزمنية")}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-1 flex-wrap justify-end">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("Search tasks by title or details...", "ابحث في المهام والمسار...")}
                            className="orbit-task-input w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-xs rounded-xl pl-8 pr-3 py-1.5 outline-hidden font-medium focus:border-zinc-400"
                        />
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="orbit-task-select bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                        <option value="all">{t("All Statuses", "جميع الحالات")}</option>
                        <option value="todo">{t("To Do", "قيد الانتظار")}</option>
                        <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                        <option value="done">{t("Completed", "المكتملة")}</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="orbit-task-select bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                        <option value="all">{t("All Priorities", "جميع الأولويات")}</option>
                        <option value="P1">High (P1)</option>
                        <option value="P2">Medium (P2)</option>
                        <option value="P3">Low (P3)</option>
                    </select>
                </div>
            </div>

            <div id="tasks-roadmap" data-component="tasks-roadmap" className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedMonthDate(new Date())}
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shadow-2xs cursor-pointer"
                        >
                            {t("Today", "اليوم")}
                        </button>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setSelectedMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-xs font-black cursor-pointer"
                                title="Previous Month"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setSelectedMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition text-xs font-black cursor-pointer"
                                title="Next Month"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-black text-zinc-900 dark:text-white px-2">
                                {monthNames[selMonth]} {selYear}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-400">{t("View By:", "العرض حسب:")}</span>
                        <div className="relative">
                            <select
                                value={granularity}
                                onChange={(e) => setGranularity(e.target.value)}
                                className="orbit-task-select appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xs px-4 py-1.5 pr-8 rounded-xl shadow-2xs cursor-pointer focus:outline-hidden"
                            >
                                <option value="days">{t("Day", "يوم")}</option>
                                <option value="weeks">{t("Week", "أسبوع")}</option>
                                <option value="months">{t("Month", "شهر")}</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none">▾</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative">
                    <div className="min-w-[950px] relative">
                        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20 text-center">
                            <div className="flex border-b border-zinc-200/60 dark:border-zinc-800/60 text-[10px] font-extrabold text-zinc-500 uppercase">
                                {granularity === 'months' ? (
                                    windowMonths.map((m, mIdx) => (
                                        <div key={mIdx} className="flex-1 py-1 border-r border-zinc-200/50 dark:border-zinc-800/40 last:border-r-0">
                                            {m.label} {m.year}
                                        </div>
                                    ))
                                ) : granularity === 'weeks' ? (
                                    weeksHeader.map((w, wIdx) => (
                                        <div key={wIdx} className="flex-1 py-1 border-r border-zinc-200/50 dark:border-zinc-800/40 last:border-r-0">
                                            {w.label}
                                        </div>
                                    ))
                                ) : (
                                    weeksHeader.map((w, wIdx) => {
                                        const weekStartDate = new Date(selYear, selMonth, w.startDay);
                                        const d = new Date(Date.UTC(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate()));
                                        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                                        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                                        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

                                        return (
                                            <div key={wIdx} className="flex-1 py-1 border-r border-zinc-200/60 dark:border-zinc-800/60 last:border-r-0 text-[10px] font-bold text-zinc-400">
                                                {`W${weekNo} ${monthNames[selMonth].slice(0, 3)} ${w.startDay} - ${w.endDay}`}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex text-[10px] font-bold text-zinc-500 py-1">
                                {granularity === 'months' ? (
                                    windowMonths.map((m, mIdx) => (
                                        <div key={mIdx} className="flex-1 border-r border-zinc-200/40 dark:border-zinc-800/30 last:border-r-0 text-[9px]">
                                            {m.quarter}
                                        </div>
                                    ))
                                ) : granularity === 'weeks' ? (
                                    weeksHeader.map((w, wIdx) => (
                                        <div key={wIdx} className="flex-1 border-r border-zinc-200/50 dark:border-zinc-800/40 last:border-r-0 py-0.5 text-center text-[9px] font-bold text-zinc-400">
                                            {w.startDay} - {w.endDay}
                                        </div>
                                    ))
                                ) : (
                                    daysHeader.map((d, dIdx) => {
                                        const isToday = new Date().getDate() === d.dayNum && new Date().getMonth() === selMonth && new Date().getFullYear() === selYear;
                                        return (
                                            <div
                                                key={dIdx}
                                                className={`flex-1 border-r border-zinc-200/50 dark:border-zinc-800/40 last:border-r-0 py-0.5 text-center relative ${isToday ? 'bg-rose-50 dark:bg-rose-950/30 font-black text-rose-600 dark:text-rose-400' : ''}`}
                                            >
                                                <div className="text-[8px] text-zinc-400 uppercase">{d.dayOfWeek}</div>
                                                <div className="text-[10px] font-extrabold flex items-center justify-center gap-0.5">
                                                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />}
                                                    <span>{d.dayNum}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="relative min-h-[420px] pt-4" style={{ height: `${Math.max(420, allTimelineItems.totalLanes * 60 + 60)}px` }}>
                            <div className="absolute inset-0 flex pointer-events-none z-0">
                                {granularity === 'months' ? (
                                    windowMonths.map((m, mIdx) => (
                                        <div key={mIdx} className="flex-1 border-r border-zinc-100 dark:border-zinc-800/30 last:border-r-0" />
                                    ))
                                ) : granularity === 'weeks' ? (
                                    weeksHeader.map((w, wIdx) => (
                                        <div key={wIdx} className="flex-1 border-r border-zinc-100 dark:border-zinc-800/30 last:border-r-0" />
                                    ))
                                ) : (
                                    daysHeader.map((d, dIdx) => {
                                        const isToday = new Date().getDate() === d.dayNum && new Date().getMonth() === selMonth && new Date().getFullYear() === selYear;
                                        return (
                                            <div
                                                key={dIdx}
                                                className={`flex-1 border-r border-zinc-100 dark:border-zinc-800/30 last:border-r-0 ${isToday ? 'bg-rose-500/5 dark:bg-rose-500/10' : ''}`}
                                            />
                                        );
                                    })
                                )}
                            </div>

                            {todayPositionPercent >= 0 && (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                                    style={{ left: `${todayPositionPercent}%` }}
                                >
                                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-600 shadow-md border border-white" />
                                </div>
                            )}

                            {allTimelineItems.items.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-400">
                                    {t("No tasks scheduled for this period", "لا توجد مهام مجدولة لهذه الفترة")}
                                </div>
                            ) : (
                                allTimelineItems.items.map((task, tIdx) => {
                                    const pos = getTaskBarPosition(task, granularity, startDateWindow, selMonth, selYear, daysInSelMonth, todayStr);
                                    const styleInfo = getTaskCardStyle(task);
                                    const initials = getAvatarInitials(tIdx);
                                    const avatarBg = getAvatarBg(tIdx);
                                    const progress = getProgressPercent(task);
                                    const sourceTag = getSourceTag(task);
                                    const laneTop = 20 + (task.laneIndex * 56);

                                    const isDone = task.status === 'done' || task.status === 'completed';
                                    const isOverdue = !isDone && new Date(task.end_date || task.due_date) < new Date();

                                    let barBgClass = "gantt-task-pill-default bg-zinc-100 dark:bg-zinc-850 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100";
                                    if (isDone) {
                                        barBgClass = "gantt-task-pill-done bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100";
                                    } else if (isOverdue) {
                                        barBgClass = "gantt-task-pill-overdue bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-100";
                                    } else if (task.status === 'in_progress') {
                                        barBgClass = "gantt-task-pill-progress bg-[#FAF4EF] dark:bg-[#2E0025] border-[#BC5C29]/60 dark:border-[#BC5C29]/50 text-[#2B2320] dark:text-[#BC5C29]";
                                    } else if (task.status === 'review') {
                                        barBgClass = "gantt-task-pill-review bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-600 text-amber-900 dark:text-amber-100";
                                    }

                                    return (
                                        <div
                                            key={task.id || tIdx}
                                            style={{ left: pos.left, width: pos.width, minWidth: '170px', top: `${laneTop}px` }}
                                            onClick={() => handleOpenDrawer(task)}
                                            className={`gantt-task-pill absolute h-9 rounded-full border shadow-md flex items-center px-3 gap-2 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer z-10 backdrop-blur-md ${barBgClass}`}
                                        >
                                            {isDone ? (
                                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-extrabold shrink-0 opacity-80">
                                                    {styleInfo.label}
                                                </span>
                                            )}

                                            <span className="text-xs font-extrabold truncate flex-1 min-w-0 flex items-center gap-1.5" title={`${sourceTag} ${task.title}`}>
                                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/25 text-white/90 shrink-0">{sourceTag}</span>
                                                <span className="truncate">{task.title}</span>
                                            </span>

                                            <span className="text-[10px] font-bold opacity-80 shrink-0">
                                                {progress}
                                            </span>

                                            <div className={`w-5 h-5 rounded-full ${avatarBg} text-[9px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs`}>
                                                {initials}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Details & Edit Modal (Styled like .old/.st/input-modal) */}
            {isDrawerOpen && selectedTask && (
                <div
                    className="fixed inset-0 z-50 overflow-hidden bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsDrawerOpen(false); }}
                >
                    <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-y-auto max-h-[90vh] p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-[#BC5C29] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <ListTodo className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                                        {isEditingInDrawer ? t("Edit Roadmap Task", "تعديل مهمة المسار") : selectedTask.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {selectedTask.type === 'note'
                                            ? t("Synced workspace note", "ملاحظة متزامنة")
                                            : t("Manage timeline schedule, priority, and status.", "إدارة الجدول الزمني والأولوية وحالة المهمة.")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {selectedTask.type !== 'note' && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingInDrawer(prev => !prev)}
                                        className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>{isEditingInDrawer ? t("View", "عرض") : t("Edit", "تعديل")}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { setIsDrawerOpen(false); setIsEditingInDrawer(false); }}
                                    className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {isEditingInDrawer && selectedTask.type !== 'note' ? (
                            <form onSubmit={handleSaveTaskDetails} className="space-y-4 text-xs font-sans">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Task Title", "عنوان المهمة")}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29] transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Description", "الوصف والتفاصيل")}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder={t("Enter task description...", "أدخل وصف المهمة...")}
                                        className="orbit-task-textarea w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29] leading-relaxed transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {t("Status", "الحالة")}
                                        </label>
                                        <select
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            className="orbit-task-select w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29]"
                                        >
                                            <option value="todo">{t("To Do", "قيد الانتظار")}</option>
                                            <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                                            <option value="done">{t("Completed", "مكتملة")}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {t("Priority", "الأولوية")}
                                        </label>
                                        <select
                                            value={editPriority}
                                            onChange={(e) => setEditPriority(e.target.value)}
                                            className="orbit-task-select w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29]"
                                        >
                                            <option value="P1">High (P1)</option>
                                            <option value="P2">Medium (P2)</option>
                                            <option value="P3">Low (P3)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {t("Due Date", "تاريخ الاستحقاق")}
                                        </label>
                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                            {t("End Date", "تاريخ الانتهاء")}
                                        </label>
                                        <input
                                            type="date"
                                            value={editEndDate}
                                            onChange={(e) => setEditEndDate(e.target.value)}
                                            className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-[#BC5C29]"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingInDrawer(false)}
                                        className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                    >
                                        {t("Cancel", "إلغاء")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-[#BC5C29] dark:hover:bg-[#9C4D31] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>{isSavingEdit ? t("Saving...", "جاري الحفظ...") : t("Save Changes", "حفظ التعديلات")}</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Description", "الوصف")}
                                    </label>
                                    <p className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                                        {selectedTask.description || t('No description provided.', 'لا يوجد وصف مدخل.')}
                                    </p>
                                </div>

                                {selectedTask.type === 'note' ? (
                                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                                        <span>{t("This item is synced from your Notes. Open Notes to edit full note details.", "تمت مزامنة هذا العنصر من الملاحظات. يمكنك فتح صفحة الملاحظات لتعديله.")}</span>
                                        <div className="mt-2">
                                            <Link href="/notes" className="font-bold underline text-xs">
                                                {t("Go to Notes →", "الانتقال إلى الملاحظات ←")}
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                                {t("Update Status", "تغيير الحالة")}
                                            </label>
                                            <div className="inline-flex w-full p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 gap-1">
                                                {['todo', 'in_progress', 'done'].map((st) => {
                                                    const labels = { todo: t('To Do', 'قيد الانتظار'), in_progress: t('In Progress', 'قيد التنفيذ'), done: t('Done', 'مكتملة') };
                                                    const isCurrent = (selectedTask.status === st) || (selectedTask.status === 'pending' && st === 'todo') || (selectedTask.status === 'completed' && st === 'done');
                                                    return (
                                                        <button
                                                            key={st}
                                                            type="button"
                                                            disabled={actionLoading}
                                                            onClick={() => handleStatusChange(selectedTask.id, st)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl font-semibold text-xs transition cursor-pointer",
                                                                isCurrent
                                                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                                                                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                            )}
                                                        >
                                                            {labels[st]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60">
                                                <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">{t("Due Date", "تاريخ الانتهاء")}</span>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedTask.due_date || 'N/A'}</span>
                                            </div>
                                            <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60">
                                                <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">{t("Priority", "الأولوية")}</span>
                                                <span className="font-bold text-[#BC5C29]">{selectedTask.priority || 'P2'}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                                    {selectedTask.type !== 'note' ? (
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => handleRequestDelete(selectedTask.id, selectedTask.title)}
                                            className="px-4 py-2 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/50 transition flex items-center gap-1.5 text-xs cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>{t("Delete", "حذف")}</span>
                                        </button>
                                    ) : <div />}

                                    <div className="flex items-center gap-2">
                                        <Link
                                            href="/tasks"
                                            className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
                                        >
                                            <span>{t("Full Board", "اللوحة الكاملة")}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                        <button
                                            onClick={() => setIsDrawerOpen(false)}
                                            className="px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
                                        >
                                            {t("Close", "إغلاق")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add New Task Modal (Styled like .old/.st/input-modal) */}
            {isAddModalOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-hidden bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget && !isSubmittingTask) setIsAddModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-[#BC5C29] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                        {t("Create Roadmap Task", "إضافة مهمة جديدة للمسار")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Schedule a milestone or deliverable directly onto your timeline.", "جدولة مهمة أو مخرج عمل مباشرة على المسار الزمني.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                disabled={isSubmittingTask}
                                className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Task Title", "عنوان المهمة")} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder={t("What needs to be done?", "ما الذي يجب إنجازه؟")}
                                    className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-4 py-3 text-xs font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {t("Description", "الوصف والتفاصيل")}
                                </label>
                                <textarea
                                    rows={3}
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder={t("Add extra context, deliverables, or checklist...", "تفاصيل المهمة، المخرجات المطلوبة...")}
                                    className="orbit-task-textarea w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-4 py-3 text-xs font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden transition leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Status", "الحالة")}
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="orbit-task-select w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden"
                                    >
                                        <option value="todo">{t("To Do", "قيد الانتظار")}</option>
                                        <option value="in_progress">{t("In Progress", "قيد التنفيذ")}</option>
                                        <option value="done">{t("Completed", "مكتملة")}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Priority", "الأولوية")}
                                    </label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="orbit-task-select w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden"
                                    >
                                        <option value="P1">High (P1)</option>
                                        <option value="P2">Medium (P2)</option>
                                        <option value="P3">Low (P3)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("Start / Due Date", "تاريخ الاستحقاق")}
                                    </label>
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                        {t("End Date", "تاريخ الانتهاء")}
                                    </label>
                                    <input
                                        type="date"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-[#BC5C29] rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    disabled={isSubmittingTask}
                                    className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingTask}
                                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-[#BC5C29] dark:hover:bg-[#9C4D31] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <span>{isSubmittingTask ? t("Creating...", "جاري الإنشاء...") : t("Create Task", "إنشاء المهمة")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={deleteModalState.isOpen}
                title={t("Delete Task", "تأكيد حذف المهمة")}
                message={t("Are you sure you want to delete this task? This action cannot be undone.", "هل أنت متأكد من رغبتك في حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.")}
                itemName={deleteModalState.taskTitle}
                confirmText={t("Delete", "حذف")}
                cancelText={t("Cancel", "إلغاء")}
                isDeleting={deleteModalState.isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
            />

            <ProductivityHeatmap todos={todos} courses={courses} />
        </div>
    );
}
