"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, X, Plus, Check, Calendar, Clock, Repeat, Layers, Search } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.jsx';
import { announceMatteAlert } from '@/components/ui/MatteAlert';
import { TodoCard } from '@/features/tasks/components/ToDoCard';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import { requestNotificationPermission, startNotificationPoller, sendBrowserNotification } from '@/features/notifications/services/notifications.js';
import { getEgyptDateStr } from '@/shared/utils/timezone.js';

import {
    fetchTodoList,
    createTodoItem,
    batchCreateTodoItems,
    toggleTodoItemDone,
    updateTodoItem,
    deleteTodoPoint,
    deleteTodoDay,
    deleteTodoSeries
} from '@/features/tasks/api/tasksTodo.api.js';
import {
    filterTodoItems,
    groupTodoItemsByDate,
    calculateTodayStats,
    calculateOverallStats,
    aggregateMissedTasks,
    getAvailableExportMonths,
    calculateExportStats,
    parseCategoryFromText,
    formatHours
} from '@/features/tasks/utils/tasksTodo.logic.js';
import { TODO_CATEGORIES, getCategoryMeta, getCategoryBadgeClasses } from '@/features/tasks/components/ToDoCard';
import PeriodSelector, { TODO_PERIOD_OPTIONS } from '@/components/ui/PeriodSelector';
import { Button } from '@/components/ui/button';

export default function ToDoPage() {
    const { t, language } = useApp();
    const [todoItems, setTodoItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsPeriod, setStatsPeriod] = useState('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedExportMonth, setSelectedExportMonth] = useState('all');
    const mounted = React.useSyncExternalStore(() => () => { }, () => true, () => false);
    const [notifPermission, setNotifPermission] = useState('granted');
    const [searchQuery, setSearchQuery] = useState('');

    const [showUpcomingDays, setShowUpcomingDays] = useState(true);
    const [showPastDays, setShowPastDays] = useState(false);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submittingAction, setSubmittingAction] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
    const [missedMonth, setMissedMonth] = useState(() => new Date().toISOString().substring(0, 7));

    const [modalTab, setModalTab] = useState('single');

    const [category, setCategory] = useState('General');
    const [text, setText] = useState('');
    const [description, setDescription] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [durationHours, setDurationHours] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);
    const [selectedDays, setSelectedDays] = useState(['Sun']);

    const todayStr = useMemo(() => getEgyptDateStr(), []);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(() => {
        const defaultEnd = new Date();
        defaultEnd.setDate(defaultEnd.getDate() + 14);
        return defaultEnd.toISOString().split('T')[0];
    });
    const [singleDate, setSingleDate] = useState(todayStr);

    const [batchDate, setBatchDate] = useState(todayStr);
    const [batchRows, setBatchRows] = useState([
        { text: '', category: 'Work', duration_hours: '1', reminder_time: '', description: '' },
        { text: '', category: 'Study', duration_hours: '1', reminder_time: '', description: '' },
        { text: '', category: 'Personal', duration_hours: '1', reminder_time: '', description: '' }
    ]);

    const [pasteDate, setPasteDate] = useState(todayStr);
    const [pasteDefaultCategory, setPasteDefaultCategory] = useState('General');
    const [pasteText, setPasteText] = useState('');

    const addBatchRow = () => {
        setBatchRows(prev => [
            ...prev,
            { text: '', category: 'Work', duration_hours: '1', reminder_time: '', description: '' }
        ]);
    };

    const updateBatchRow = (index, field, value) => {
        setBatchRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const removeBatchRow = (index) => {
        setBatchRows(prev => {
            if (prev.length <= 1) {
                return [{ text: '', category: 'Work', duration_hours: '1', reminder_time: '', description: '' }];
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const WEEKDAYS = useMemo(() => [
        { key: 'Sun', nameEn: 'Sunday', nameAr: 'الأحد' },
        { key: 'Mon', nameEn: 'Monday', nameAr: 'الإثنين' },
        { key: 'Tue', nameEn: 'Tuesday', nameAr: 'الثلاثاء' },
        { key: 'Wed', nameEn: 'Wednesday', nameAr: 'الأربعاء' },
        { key: 'Thu', nameEn: 'Thursday', nameAr: 'الخميس' },
        { key: 'Fri', nameEn: 'Friday', nameAr: 'الجمعة' },
        { key: 'Sat', nameEn: 'Saturday', nameAr: 'السبت' }
    ], []);

    const reloadTodoList = useCallback(async () => {
        try {
            const data = await fetchTodoList();
            if (Array.isArray(data)) {
                setTodoItems(data);
            }
        } catch (e) {
            console.error('Error fetching todo items:', e);
        }
    }, []);

    useEffect(() => {



        let isMounted = true;
        fetchTodoList()
            .then(data => {
                if (isMounted && Array.isArray(data)) {
                    setTodoItems(data);
                }
            })
            .catch(e => {
                console.error('Error fetching todo items:', e);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        startNotificationPoller();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            setNotifPermission('granted');
            sendBrowserNotification({
                title: t(' To-Do Notifications Enabled!', ' تم تفعيل إشعارات التو دو!'),
                body: t('You will receive reminders for scheduled items.', 'ستصلك تنبيهات النقاط المحددة بوقت مباشرة على جهازك.'),
                url: '/tasks/todo'
            });
        } else {
            setNotifPermission('denied');
        }
    };

    const toggleDaySelection = (dayKey) => {
        if (selectedDays.includes(dayKey)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter(d => d !== dayKey));
            }
        } else {
            setSelectedDays([...selectedDays, dayKey]);
        }
    };

    const handleCreateTodo = async (e, keepOpen = false) => {
        if (e && e.preventDefault) e.preventDefault();
        if (submittingAction) return;
        if (!text.trim()) {
            announceMatteAlert({
                tone: 'warning',
                title: t('Missing Task Title', 'عنوان المهمة مطلوب'),
                description: t('Please enter a point title before saving.', 'يرجى كتابة عنوان النقطة قبل الحفظ.')
            });
            return;
        }

        const actionKey = keepOpen ? 'create-another' : 'create-single';
        setSubmittingAction(actionKey);
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        const payload = {
            action: 'create_todo_point',
            text: text.trim(),
            category: category || 'General',
            description: description.trim(),
            due_date: isRecurring ? startDate : singleDate,
            start_date: isRecurring ? startDate : singleDate,
            end_date: isRecurring ? endDate : singleDate,
            reminder_time: reminderTime || null,
            duration_hours: durationHours || '1',
            is_recurring: isRecurring ? 1 : 0,
            repeat_days: isRecurring ? selectedDays : null
        };

        try {
            const data = await createTodoItem(payload);
            if (data?.success || data?.ok) {
                const createdCount = data.count || 1;
                setText('');
                setDescription('');
                if (!keepOpen) {
                    setIsModalOpen(false);
                }
                await reloadTodoList();
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
                const msg = keepOpen
                    ? t('Point saved! You can add another point now.', 'تم حفظ النقطة بنجاح! يمكنك إضافة نقطة أخرى مباشرة.')
                    : (createdCount > 1
                        ? t(`Point created across ${createdCount} matching days!`, `تم توليد وتوزيع النقطة على ${createdCount} أيام متطابقة بنجاح!`)
                        : t('Point created successfully!', 'تم إنشاء النقطة بنجاح!'));
                setSuccessMessage(`✅ ${msg}`);
                announceMatteAlert({
                    tone: 'success',
                    title: t('Task Saved', 'تم حفظ المهمة'),
                    description: msg
                });
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                announceMatteAlert({
                    tone: 'danger',
                    title: t('Creation Failed', 'فشل الإنشاء'),
                    description: data?.error || t('Failed to create point', 'فشل إنشاء النقطة')
                });
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to create point', 'فشل إنشاء النقطة')
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleCreateBatch = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (submittingAction) return;
        const validRows = batchRows.filter(r => r.text && r.text.trim());
        if (validRows.length === 0) {
            announceMatteAlert({
                tone: 'warning',
                title: t('No Tasks Entered', 'لا توجد مهام'),
                description: t('Please enter at least one task title.', 'يرجى كتابة مهمة واحدة على الأقل.')
            });
            return;
        }

        setSubmittingAction('create-batch');
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        try {
            const payloadItems = validRows.map(r => ({
                text: r.text.trim(),
                category: r.category || 'General',
                duration_hours: r.duration_hours || '1',
                reminder_time: r.reminder_time || null,
                description: r.description ? r.description.trim() : null,
                due_date: batchDate
            }));

            const data = await batchCreateTodoItems(payloadItems, batchDate);
            if (data?.success || data?.ok) {
                const count = data.count || validRows.length;
                setBatchRows([
                    { text: '', category: 'Work', duration_hours: '1', reminder_time: '', description: '' },
                    { text: '', category: 'Study', duration_hours: '1', reminder_time: '', description: '' },
                    { text: '', category: 'Personal', duration_hours: '1', reminder_time: '', description: '' }
                ]);
                setIsModalOpen(false);
                await reloadTodoList();
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
                const msg = t(`Successfully created ${count} points!`, `تم إنشاء ${count} نقاط بنجاح!`);
                setSuccessMessage(`✅ ${msg}`);
                announceMatteAlert({
                    tone: 'success',
                    title: t('Batch Created', 'تمت الإضافة المتعددة'),
                    description: msg
                });
                setTimeout(() => setSuccessMessage(''), 4000);
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to create batch points', 'فشل إنشاء النقاط')
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleCreateQuickPaste = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (submittingAction) return;
        const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        setSubmittingAction('create-paste');
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        try {
            const payloadItems = lines.map(line => {
                const parsed = parseCategoryFromText(line, pasteDefaultCategory);
                return {
                    text: parsed.cleanText,
                    category: parsed.category,
                    duration_hours: '1',
                    reminder_time: null,
                    due_date: pasteDate
                };
            });

            const data = await batchCreateTodoItems(payloadItems, pasteDate);
            if (data?.success || data?.ok) {
                const count = data.count || payloadItems.length;
                setPasteText('');
                setIsModalOpen(false);
                await reloadTodoList();
                if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
                const msg = t(`Successfully created ${count} points!`, `تم إنشاء ${count} نقاط بنجاح!`);
                setSuccessMessage(`✅ ${msg}`);
                announceMatteAlert({
                    tone: 'success',
                    title: t('Tasks Imported', 'تم استيراد المهام'),
                    description: msg
                });
                setTimeout(() => setSuccessMessage(''), 4000);
            }
        } catch (err) {
            announceMatteAlert({
                tone: 'danger',
                title: t('Error', 'خطأ'),
                description: err?.message || t('Failed to import tasks', 'فشل استيراد المهام')
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    const handleToggleDone = async (item) => {
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        setTodoItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
        try {
            await toggleTodoItemDone(item.id, !item.done);
            await reloadTodoList();
            if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
        } catch (e) {
            console.error('Error toggling done status:', e);
            reloadTodoList();
        }
    };

    const [editItem, setEditItem] = useState(null);
    const [editText, setEditText] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editDescription, setEditDescription] = useState('');
    const [editReminderTime, setEditReminderTime] = useState('');
    const [editDurationHours, setEditDurationHours] = useState('1');
    const [editDueDate, setEditDueDate] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleOpenEdit = (item) => {
        if (!item) return;
        setEditItem(item);
        setEditText(item.text || '');
        setEditCategory(item.category || 'General');
        setEditDescription(item.description || '');
        setEditReminderTime(item.reminder_time || '');
        setEditDurationHours(item.duration_hours ? String(item.duration_hours) : '1');
        setEditDueDate(item.due_date || todayStr);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editItem || isSavingEdit) return;
        if (!editText.trim()) {
            announceMatteAlert({
                tone: 'warning',
                title: t('Title required', 'عنوان النقطة مطلوب'),
                description: t('Please enter a task title.', 'يرجى كتابة عنوان للنقطة.')
            });
            return;
        }

        setIsSavingEdit(true);
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        const payload = {
            text: editText.trim(),
            category: editCategory || 'General',
            description: editDescription.trim() || null,
            reminder_time: editReminderTime || null,
            duration_hours: editDurationHours || '1',
            due_date: editDueDate || editItem.due_date
        };

        try {
            setTodoItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...payload } : i));
            setIsEditModalOpen(false);

            const res = await updateTodoItem(editItem.id, payload);
            if (res?.ok || res?.success) {
                announceMatteAlert({
                    tone: 'success',
                    title: t('Updated Successfully', 'تم التعديل بنجاح'),
                    description: t(`Task "${editText.trim()}" updated.`, `تم تعديل النقطة "${editText.trim()}" بنجاح.`)
                });
            } else {
                await reloadTodoList();
            }
            if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
        } catch (err) {
            console.error('Error updating todo point:', err);
            announceMatteAlert({
                tone: 'danger',
                title: t('Update Failed', 'فشل التعديل'),
                description: err?.message || t('Failed to update task.', 'تعذر تعديل النقطة.')
            });
            await reloadTodoList();
        } finally {
            setIsSavingEdit(false);
            setEditItem(null);
        }
    };

    const executeDelete = async () => {
        if (!deleteTarget || isDeleting) return;
        setIsDeleting(true);
        const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
        const target = deleteTarget;

        try {
            if (target.type === 'item') {
                setTodoItems(prev => prev.filter(i => String(i.id) !== String(target.id)));
                await deleteTodoPoint(target.id);
            } else if (target.type === 'day') {
                setTodoItems(prev => prev.filter(i => i.due_date !== target.dateStr));
                await deleteTodoDay(target.dateStr);
            } else if (target.type === 'series') {
                setTodoItems(prev => prev.filter(i => i.series_id !== target.seriesId));
                await deleteTodoSeries(target.seriesId);
            }
            setDeleteTarget(null);
            if (typeof window !== 'undefined') window.scrollTo({ top: scrollY, behavior: 'instant' });
            announceMatteAlert({
                tone: 'success',
                title: t('Deleted Successfully', 'تم الحذف بنجاح'),
                description: target.type === 'series'
                    ? t('Full recurring series removed.', 'تم حذف سلسلة التكرار بالكامل.')
                    : (target.item?.text
                        ? t(`"${target.item.text}" removed.`, `تم حذف "${target.item.text}" بنجاح.`)
                        : t('Selected item(s) removed.', 'تم حذف العناصر المحددة.'))
            });
            await reloadTodoList();
        } catch (e) {
            console.error('Error deleting todo item:', e);
            announceMatteAlert({
                tone: 'danger',
                title: t('Delete Failed', 'فشل الحذف'),
                description: e?.message || t('Could not delete selected item.', 'تعذر حذف العنصر المحدد.')
            });
            await reloadTodoList();
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredItems = useMemo(() => {
        return filterTodoItems(todoItems, searchQuery, filterStartDate, filterEndDate, selectedCategoryFilter);
    }, [todoItems, searchQuery, filterStartDate, filterEndDate, selectedCategoryFilter]);

    const categoryCounts = useMemo(() => {
        const counts = { all: todoItems.length };
        TODO_CATEGORIES.forEach(c => {
            counts[c.id.toLowerCase()] = 0;
        });
        todoItems.forEach(item => {
            const cat = (item.category || 'General').toLowerCase();
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [todoItems]);

    const groupedByDate = useMemo(() => {
        return groupTodoItemsByDate(filteredItems, language);
    }, [filteredItems, language]);

    const todayItems = useMemo(() => groupedByDate[todayStr] || [], [groupedByDate, todayStr]);

    const todayStats = useMemo(() => {
        return calculateTodayStats(todayItems);
    }, [todayItems]);

    const {
        todayTotal,
        todayCompleted,
        todayPercent,
        todayTotalHours,
        todayCompletedHours,
        remainingDayHours,
        dayHoursPercent
    } = todayStats;

    const overallStats = useMemo(() => {
        return calculateOverallStats(filteredItems, todayStr, statsPeriod);
    }, [filteredItems, todayStr, statsPeriod]);

    const {
        elapsedTotal,
        elapsedCompleted,
        futurePendingItems,
        totalPeriodItems,
        allTimeTotalItems,
        overallPercentage,
        overduePeriodItems,
        performanceLabel,
        allTotalItems,
        allCompletedItems,
        allOverdueItems
    } = overallStats;

    const upcomingDates = useMemo(() => {
        return Object.keys(groupedByDate)
            .filter(d => d > todayStr && d !== 'بدون تاريخ' && d !== 'No Date')
            .sort((a, b) => a.localeCompare(b));
    }, [groupedByDate, todayStr]);

    const pastDates = useMemo(() => {
        return Object.keys(groupedByDate)
            .filter(d => d < todayStr && d !== 'بدون تاريخ' && d !== 'No Date')
            .sort((a, b) => b.localeCompare(a));
    }, [groupedByDate, todayStr]);

    const undatedItems = useMemo(() => {
        return groupedByDate['بدون تاريخ'] || groupedByDate['No Date'] || [];
    }, [groupedByDate]);

    const missedTasksSummary = useMemo(() => {
        return aggregateMissedTasks(todoItems, todayStr, language, missedMonth);
    }, [todoItems, todayStr, language, missedMonth]);

    const availableMonths = useMemo(() => {
        return getAvailableExportMonths(todoItems);
    }, [todoItems]);

    const exportPreviewStats = useMemo(() => {
        return calculateExportStats(todoItems, selectedExportMonth, todayStr);
    }, [todoItems, selectedExportMonth, todayStr]);

    return (
        <div className="p-0 sm:p-4 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="p-1">✕</button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 p-4 sm:p-5 rounded-xl shadow-sm mb-6">
                <div>
                    <h1 className="orbit-h1 text-[28px] leading-[34px] lg:text-[32px] lg:leading-[38px] font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                        <span className="text-emerald-500 font-mono">☑</span>
                        <span>{t("To-Do Checklist & Recurring Points", "قائمة To-Do والنقاط اليومية")}</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                        {t("Today's checklist featured at top center, followed by upcoming schedule and past items.", "نقاط اليوم تظهر مميزة في المنتصف بالأعلى، وتليها الأيام القادمة والأيام السابقة.")}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <span className="absolute inset-y-0 start-3 flex items-center text-zinc-400 pointer-events-none">
                            <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t("Search items...", "البحث في النقاط...")}
                            className="orbit-task-input w-full min-h-[44px] bg-white dark:bg-zinc-800 border border-[#E5E7EB] dark:border-zinc-700 ps-9 pe-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29]"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
                        {mounted && notifPermission !== 'granted' && (
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={handleEnableNotifications}
                                className="flex-1 sm:flex-none cursor-pointer text-amber-600 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                            >
                                {t("Enable Notifications", "تفعيل الإشعارات")}
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            size="default"
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex-1 sm:flex-none cursor-pointer"
                            title={t("Export monthly points & analytics", "تصدير النقاط والشهور وإحصائياتها")}
                        >
                            <span>📊</span>
                            <span>{t("Export Report", "تصدير")}</span>
                        </Button>

                        <Button
                            variant="default"
                            size="default"
                            onClick={() => { setModalTab('single'); setIsModalOpen(true); }}
                            className="flex-1 sm:flex-none cursor-pointer"
                        >
                            <span>➕</span>
                            <span>{t("Add Point", "إضافة نقطة")}</span>
                        </Button>

                        <Button
                            variant="default"
                            size="default"
                            onClick={() => { setModalTab('batch'); setIsModalOpen(true); }}
                            className="flex-1 sm:flex-none cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                        >
                            <span>📋</span>
                            <span>{t("Batch Add", "إضافة متعددة")}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-zinc-900/70 p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                        <span className="text-sm">⏱️</span>
                        <span>{t("Analytics Period:", "فترة الحساب:")}</span>
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden md:inline">
                        {t("(Completion rate calculated on elapsed days up to today)", "(معدل الإنجاز يُحسب على الأيام المنقضية حتى اليوم)")}
                    </span>
                </div>
                <PeriodSelector
                    value={statsPeriod}
                    onChange={setStatsPeriod}
                    t={t}
                    options={TODO_PERIOD_OPTIONS}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider truncate">
                                {t("Overall Completion Rate", "معدل الإنجاز العام")}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                {TODO_PERIOD_OPTIONS.find(p => p.key === statsPeriod)?.[language === 'ar' ? 'labelAr' : 'labelEn'] || t('Period', 'الفترة')}
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                                {overallPercentage}%
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {t(performanceLabel.en, performanceLabel.ar)}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${overallPercentage}%` }} />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10.5px] text-slate-500 dark:text-zinc-400 flex items-center justify-between font-medium">
                        <span>{t("Elapsed days ratio:", "المستحق حتى اليوم:")}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            {elapsedCompleted}/{elapsedTotal}
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                            {t("Completed Points", "النقاط المنجزة")}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                                {elapsedCompleted}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/ {elapsedTotal}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t("Points executed up to today", "نقاط تم تنفيذها حتى اليوم")}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10.5px] text-slate-500 dark:text-zinc-400 flex items-center justify-between font-medium">
                        <span>{t("Total planned in period:", "إجمالي المخطط للفترة:")}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            {totalPeriodItems} {t("pts", "نقطة")}
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                            {t("Today's Progress", "إنجاز نقاط اليوم")}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black font-mono text-amber-500">
                                {todayCompleted}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/ {todayTotal}</span>
                        </div>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                            {todayPercent}% {t("completed today", "مكتمل لليوم")}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10.5px] text-slate-500 dark:text-zinc-400 flex items-center justify-between font-medium">
                        <span>{t("Remaining today:", "المتبقي اليوم:")}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            {Math.max(0, todayTotal - todayCompleted)} {t("pts", "نقطة")}
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                            {t("Overdue Points", "نقاط متأخرة")}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-black font-mono text-rose-500">
                                {overduePeriodItems}
                            </span>
                            <span className="text-xs text-slate-400">
                                {t("overdue", "نقاط انقضى موعدها")}
                            </span>
                        </div>
                        <p className="text-[11px] text-rose-500 font-bold">
                            {t("Needs attention", "تحتاج للتنفيذ والإنجاز")}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[10.5px] text-slate-500 dark:text-zinc-400 flex items-center justify-between font-medium">
                        <span>{t("All-time system total:", "إجمالي كل النقاط بالنظام:")}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            {allTimeTotalItems} {t("pts", "نقطة")}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
                <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${selectedCategoryFilter === 'all'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                >
                    <span>🌐</span>
                    <span>{t("All", "الكل")}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-bold">
                        {categoryCounts['all'] || 0}
                    </span>
                </button>

                {TODO_CATEGORIES.map(cat => {
                    const isSelected = selectedCategoryFilter.toLowerCase() === cat.id.toLowerCase();
                    const count = categoryCounts[cat.id.toLowerCase()] || 0;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat.id.toLowerCase())}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${isSelected
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-bold">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
                    {t("Loading To-Do list...", "جاري تحميل قائمة To-Do...")}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
                        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⏳</span>
                                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white tracking-wide">
                                        24-HOUR DAILY TIME BUDGET
                                    </span>
                                </div>
                                <span className="text-xs font-extrabold font-mono px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                                    {formatHours(todayTotalHours)}h / 24h ({dayHoursPercent}%)
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 text-center">
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                                    <span className="text-xs text-zinc-400 font-bold block mb-1">Planned</span>
                                    <span className="text-sm sm:text-base font-extrabold font-mono text-zinc-900 dark:text-white">{formatHours(todayTotalHours)}h</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                                    <span className="text-xs text-zinc-400 font-bold block mb-1">Completed</span>
                                    <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{formatHours(todayCompletedHours)}h</span>
                                </div>
                                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                                    <span className="text-xs text-zinc-400 font-bold block mb-1">Rest/Sleep</span>
                                    <span className="text-sm sm:text-base font-extrabold font-mono text-zinc-900 dark:text-white">{formatHours(remainingDayHours)}h</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 w-full py-1">
                                    {Array.from({ length: 24 }).map((_, idx) => {
                                        const isPlanned = idx < Math.round(todayTotalHours);
                                        const isCompleted = idx < Math.round(todayCompletedHours);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex-1 h-4 rounded-full transition-all duration-300 ${isCompleted
                                                    ? 'bg-emerald-500 shadow-2xs'
                                                    : isPlanned
                                                        ? 'bg-black dark:bg-white shadow-2xs'
                                                        : 'bg-zinc-200 dark:bg-zinc-800'
                                                    }`}
                                                title={`Hour ${idx + 1}: ${isCompleted ? 'Completed' : isPlanned ? 'Planned Work' : 'Rest/Sleep'}`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs font-bold text-zinc-400 font-mono px-0.5">
                                    <span>00:00</span>
                                    <span className="text-zinc-500 dark:text-zinc-400">{formatHours(todayTotalHours)}h work / {formatHours(remainingDayHours)}h rest</span>
                                    <span>24:00</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white tracking-wide">
                                        TODAY&apos;S PROGRESS
                                    </span>
                                </div>
                                <span className="text-xs font-extrabold font-mono px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    {todayPercent}%
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold my-auto py-4">
                                <span className="text-zinc-800 dark:text-zinc-200 text-sm">
                                    Completed <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">{todayCompleted}</span> of <span className="font-mono text-base">{todayTotal}</span> points
                                </span>
                                <span className="text-xs text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-xl">
                                    {todayCompleted} / {todayTotal}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-1.5 w-full py-1">
                                    {Array.from({ length: Math.max(todayTotal, 12) }).map((_, idx) => {
                                        const totalBlocks = Math.max(todayTotal, 12);
                                        const isDone = todayTotal > 0
                                            ? idx < Math.round((todayCompleted / todayTotal) * totalBlocks)
                                            : false;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex-1 h-4 rounded-full transition-all duration-300 ${isDone
                                                    ? 'bg-emerald-500 dark:bg-emerald-400 shadow-2xs'
                                                    : 'bg-zinc-100 dark:bg-zinc-800'
                                                    }`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs font-bold text-zinc-400 font-mono px-0.5">
                                    <span>0%</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{todayPercent}% {t("Completed", "مكتمل")}</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl mx-auto items-stretch pt-2">
                        <div className="space-y-3 w-full">
                            <div className="flex items-center justify-between px-1">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-600 dark:text-amber-400 text-xs font-black">
                                    <span>📋</span>
                                    <span>{t("TODAY'S CHECKLIST", "نقاط اليوم")}</span>
                                </div>
                                <span className="text-xs text-zinc-400 font-mono font-bold">
                                    {todayCompleted} / {todayTotal} {t("Done", "مكتمل")}
                                </span>
                            </div>

                            <div className="w-full">
                                {todayItems.length > 0 ? (
                                    <TodoCard
                                        dateStr={todayStr}
                                        items={todayItems}
                                        onToggleItem={handleToggleDone}
                                        onEditItem={handleOpenEdit}
                                        onDeleteItem={(itemOrId) => {
                                            const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
                                            const item = typeof itemOrId === 'object' ? itemOrId : todoItems.find(i => String(i.id) === String(itemOrId));
                                            setDeleteTarget({ type: 'item', id, item });
                                        }}
                                        onDeleteDay={(dateStr) => setDeleteTarget({ type: 'day', dateStr })}
                                        onDeleteSeries={(seriesId) => setDeleteTarget({ type: 'series', seriesId })}
                                    />
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                                        <span className="text-3xl block">🎉</span>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {t("No items scheduled for Today", "لا توجد نقاط مضافة لليوم حتى الآن")}
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setSingleDate(todayStr);
                                                setIsRecurring(false);
                                                setIsModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-black hover:bg-zinc-900 text-white border border-white/20 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
                                        >
                                            {t("+ Add Point for Today", "+ إضافة نقطة لليوم")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 w-full">
                            <div className="flex items-center justify-between px-1">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-600 dark:text-rose-400 text-xs font-black">
                                    <span>⚠️</span>
                                    <span>{t("MISSED TASKS SUMMARY", "ملخص المهام الضائعة")}</span>
                                </div>
                                <span className="text-xs text-rose-500 font-bold font-mono">
                                    {missedTasksSummary.reduce((s, i) => s + i.count, 0)} {t("Missed Instances", "مرة ضائعة")}
                                </span>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 gap-3 flex-wrap">
                                    <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <span className="text-rose-500">📊</span>
                                        <span>{t("Most Missed Tasks", "أكثر المهام التي ضاعت")}</span>
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <select
                                            value={missedMonth}
                                            onChange={e => setMissedMonth(e.target.value)}
                                            className="orbit-task-select text-[11px] font-bold font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                                        >
                                            <option value="all">{t("All Time", "كل الوقت")}</option>
                                            {availableMonths.map(m => (
                                                <option key={m} value={m}>
                                                    {new Date(m + '-01').toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                                            {formatHours(missedTasksSummary.reduce((s, i) => s + (i.totalHours || 0), 0))}h {t("Lost Total", "إجمالي ساعات ضائعة")}
                                        </span>
                                    </div>
                                </div>

                                {missedTasksSummary.length > 0 ? (
                                    <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                                        <table className="w-full text-left rtl:text-right border-collapse font-sans">
                                            <thead>
                                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 font-extrabold tracking-wider">
                                                    <th className="py-3.5 px-4">{t("Task Name", "اسم المهمة")}</th>
                                                    <th className="py-3.5 px-4 text-center">{t("Times Missed", "عدد المرات")}</th>
                                                    <th className="py-3.5 px-4 text-right">{t("Total Hours Lost", "إجمالي الساعات")}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-semibold">
                                                {missedTasksSummary.map((task, idx) => (
                                                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150 border-b border-zinc-100 dark:border-zinc-800">
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-bold text-zinc-900 dark:text-white truncate max-w-[170px] sm:max-w-[210px]" title={task.title}>
                                                                {task.title}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-extrabold border border-rose-500/20 shadow-xs">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                <span>{task.count} {t("times", "مرة")}</span>
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right font-mono">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-extrabold border border-amber-500/20 shadow-xs">
                                                                <span>{formatHours(task.totalHours)}h</span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center space-y-2">
                                        <span className="text-2xl block">✨</span>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {t("Great job! No missed tasks recorded in history.", "ممتاز جداً! لا توجد أي مهمات ضائعة في السجل.")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowUpcomingDays(!showUpcomingDays)}
                                    className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 text-left"
                                >
                                    <span>📅</span>
                                    <span>{t("Upcoming Schedule", "الأيام القادمة")}</span>
                                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        {upcomingDates.length}
                                    </span>
                                    <span className="text-xs text-slate-400">{showUpcomingDays ? '▲' : '▼'}</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="orbit-task-input bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                                    placeholder={t("From Date", "من تاريخ")}
                                />
                                <span className="text-xs text-slate-400">→</span>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="orbit-task-input bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                                    placeholder={t("To Date", "إلى تاريخ")}
                                />
                                {(filterStartDate || filterEndDate) && (
                                    <button
                                        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                                        className="text-xs text-rose-500 font-bold hover:underline px-1"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {showUpcomingDays && (
                            <div className="animate-fade-in space-y-4">
                                {upcomingDates.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-slate-400">
                                        {t("No upcoming items match the selected criteria.", "لا توجد نقاط قادمة تطابق البحث أو الفلتر.")}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                                        {upcomingDates.map(dateStr => (
                                            <TodoCard
                                                key={dateStr}
                                                dateStr={dateStr}
                                                items={groupedByDate[dateStr]}
                                                onToggleItem={handleToggleDone}
                                                onEditItem={handleOpenEdit}
                                                onDeleteItem={(itemOrId) => {
                                                    const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
                                                    const item = typeof itemOrId === 'object' ? itemOrId : todoItems.find(i => String(i.id) === String(itemOrId));
                                                    setDeleteTarget({ type: 'item', id, item });
                                                }}
                                                onDeleteDay={(date) => setDeleteTarget({ type: 'day', dateStr: date })}
                                                onDeleteSeries={(seriesId) => setDeleteTarget({ type: 'series', seriesId })}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {undatedItems.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>📌</span>
                                <span>{t("General Items", "نقاط بدون تاريخ")}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                                <TodoCard
                                    dateStr={language === 'ar' ? 'بدون تاريخ' : 'No Date'}
                                    items={undatedItems}
                                    onToggleItem={handleToggleDone}
                                    onEditItem={handleOpenEdit}
                                    onDeleteItem={(itemOrId) => {
                                        const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
                                        const item = typeof itemOrId === 'object' ? itemOrId : todoItems.find(i => String(i.id) === String(itemOrId));
                                        setDeleteTarget({ type: 'item', id, item });
                                    }}
                                    onDeleteDay={(date) => setDeleteTarget({ type: 'day', dateStr: date })}
                                    onDeleteSeries={(seriesId) => setDeleteTarget({ type: 'series', seriesId })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-zinc-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                            <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                    {t("Past Days Archive", "سجل الأيام السابقة")}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    {t("Toggle to view or review points from previous days.", "خيار لعرض وتصفح نقاط الأيام التي انقضت.")}
                                </span>
                            </div>

                            <button
                                onClick={() => setShowPastDays(!showPastDays)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${showPastDays
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 border-slate-900'
                                    : 'bg-white text-slate-700 dark:bg-zinc-900 dark:text-slate-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
                                    }`}
                            >
                                {showPastDays
                                    ? t("Hide Past Days ✕", "إخفاء الأيام السابقة ✕")
                                    : t(`Show Past Days (${pastDates.length}) `, `إظهار الأيام السابقة (${pastDates.length}) `)}
                            </button>
                        </div>

                        {showPastDays && (
                            <div className="animate-fade-in space-y-4">
                                {pastDates.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-slate-400">
                                        {t("No past days recorded.", "لا توجد أرقام أو سجلات للأيام السابقة.")}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                                        {pastDates.map(dateStr => (
                                            <TodoCard
                                                key={dateStr}
                                                dateStr={dateStr}
                                                items={groupedByDate[dateStr]}
                                                onToggleItem={handleToggleDone}
                                                onEditItem={handleOpenEdit}
                                                onDeleteItem={(itemOrId) => {
                                                    const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
                                                    const item = typeof itemOrId === 'object' ? itemOrId : todoItems.find(i => String(i.id) === String(itemOrId));
                                                    setDeleteTarget({ type: 'item', id, item });
                                                }}
                                                onDeleteDay={(date) => setDeleteTarget({ type: 'day', dateStr: date })}
                                                onDeleteSeries={(seriesId) => setDeleteTarget({ type: 'series', seriesId })}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget && !submittingAction) setIsModalOpen(false); }}
                >
                    <div
                        className={`relative bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl w-full shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden text-zinc-900 dark:text-white ${modalTab === 'batch' ? 'max-w-3xl' : 'max-w-xl'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {submittingAction && (
                            <div className="md-progress-track">
                                <div className="md-progress-bar" />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 sm:px-8 py-5 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shrink-0">
                            <div className="flex items-center gap-3.5 flex-wrap">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("To-Do Task", "مهمة To-Do")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {t("Create single, batch, or pasted tasks", "إضافة مهمة مفردة أو مهام متعددة")}
                                    </p>
                                </div>
                                <div className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200/80 dark:border-zinc-800 gap-0.5 sm:ms-2">
                                    <button
                                        type="button"
                                        disabled={!!submittingAction}
                                        onClick={() => setModalTab('single')}
                                        className={`h-7 px-3.5 rounded-full text-xs font-semibold transition cursor-pointer ${modalTab === 'single'
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t("Single", "نقطة واحدة")}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!!submittingAction}
                                        onClick={() => setModalTab('batch')}
                                        className={`h-7 px-3.5 rounded-full text-xs font-semibold transition cursor-pointer ${modalTab === 'batch'
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t("Batch (Multi-Rows)", "نقاط متعددة")}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!!submittingAction}
                                        onClick={() => setModalTab('paste')}
                                        className={`h-7 px-3.5 rounded-full text-xs font-semibold transition cursor-pointer ${modalTab === 'paste'
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {t("Quick Paste", "لصق سريع")}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={!!submittingAction}
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition cursor-pointer shrink-0 self-end sm:self-auto disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
                            {modalTab === 'single' && (
                                <form onSubmit={(e) => handleCreateTodo(e, false)} className="space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                            {t("Point Title / Task", "عنوان النقطة / المهمة")} <span className="text-crit">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!!submittingAction}
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder={t("e.g. Review design and code...", "مثال: مراجعة الديزاين والمحتوى...")}
                                            className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                {t("Category / Classification", "التصنيف")}
                                            </label>
                                            <select
                                                disabled={!!submittingAction}
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="orbit-task-select w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition cursor-pointer"
                                            >
                                                {TODO_CATEGORIES.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.icon} {language === 'ar' ? cat.labelAr : cat.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                {t("Description (Optional)", "وصف فرعي (اختياري)")}
                                            </label>
                                            <input
                                                type="text"
                                                disabled={!!submittingAction}
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder={t("Additional details...", "تفاصيل إضافية...")}
                                                className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                {t("Reminder Time", "وقت التنبيه")}
                                            </label>
                                            <input
                                                type="time"
                                                disabled={!!submittingAction}
                                                value={reminderTime}
                                                onChange={(e) => setReminderTime(e.target.value)}
                                                className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                {t("Duration (Hours)", "المدة بالساعات")}
                                            </label>
                                            <select
                                                disabled={!!submittingAction}
                                                value={durationHours}
                                                onChange={(e) => setDurationHours(e.target.value)}
                                                className="orbit-task-select w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-mono font-medium focus:outline-none focus:border-[#BC5C29] disabled:opacity-60 transition cursor-pointer"
                                            >
                                                <option value="0.08">⏱️ 5 Mins (5m) - 5 دقائق</option>
                                                <option value="0.25">⏱️ 15 Mins (0.25h) - 15 دقيقة</option>
                                                <option value="0.5">⏱️ 30 Mins (0.5h) - 30 دقيقة</option>
                                                <option value="0.75">⏱️ 45 Mins (0.75h) - 45 دقيقة</option>
                                                <option value="1">⏱️ 1 Hour (1h) - ساعة واحدة</option>
                                                <option value="1.5">⏱️ 1.5 Hours (1.5h) - ساعة ونصف</option>
                                                <option value="2">⏱️ 2 Hours (2h) - ساعتين</option>
                                                <option value="3">⏱️ 3 Hours (3h) - 3 ساعات</option>
                                                <option value="4">⏱️ 4 Hours (4h) - 4 ساعات</option>
                                                <option value="8">⏱️ 8 Hours (8h) - 8 ساعات (شغل)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <span className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                                                    <Repeat className="w-3.5 h-3.5 text-[#BC5C29]" />
                                                    {t("Enable Recurring (Repeat on Weekdays)", "تفعيل التكرار على أيام الأسبوع والنطاق")}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                                                    {t("Auto-generates points for selected days in range", "توليد النقاط آلياً على الأيام المختارة")}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={!!submittingAction}
                                                onClick={() => setIsRecurring(!isRecurring)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${isRecurring ? 'bg-[#BC5C29]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {isRecurring ? (
                                            <div className="space-y-3.5 pt-3.5 border-t border-zinc-200/70 dark:border-zinc-800">
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                                                        {t("Select Weekdays (Sun, Mon, Tue...):", "تحديد أيام الأسبوع (حد، اتنين، تلات...):")}
                                                    </label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {WEEKDAYS.map(day => {
                                                            const isSelected = selectedDays.includes(day.key);
                                                            return (
                                                                <button
                                                                    key={day.key}
                                                                    type="button"
                                                                    disabled={!!submittingAction}
                                                                    onClick={() => toggleDaySelection(day.key)}
                                                                    className={`h-8 px-3.5 rounded-full text-xs font-semibold transition border inline-flex items-center gap-1 cursor-pointer ${isSelected
                                                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs'
                                                                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                                        }`}
                                                                >
                                                                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                                                    <span>{t(day.nameEn, day.nameAr)}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3.5">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                            {t("Start Date", "تاريخ البداية")}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            required={isRecurring}
                                                            disabled={!!submittingAction}
                                                            value={startDate}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-[#BC5C29]"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                            {t("End Date", "تاريخ النهاية")}
                                                        </label>
                                                        <input
                                                            type="date"
                                                            required={isRecurring}
                                                            disabled={!!submittingAction}
                                                            value={endDate}
                                                            onChange={(e) => setEndDate(e.target.value)}
                                                            className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-[#BC5C29]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3.5 border-t border-zinc-200/70 dark:border-zinc-800">
                                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                    {t("Single Specific Date (Yesterday, Today, Tomorrow...)", "تاريخ النقطة (أمس، اليوم، غداً...)")}
                                                </label>
                                                <input
                                                    type="date"
                                                    required={!isRecurring}
                                                    disabled={!!submittingAction}
                                                    value={singleDate}
                                                    onChange={(e) => setSingleDate(e.target.value)}
                                                    className="orbit-task-input w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-[#BC5C29]"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                                        <button
                                            type="button"
                                            disabled={!!submittingAction}
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                                        >
                                            {t("Cancel", "إلغاء")}
                                        </button>

                                        <div className="flex items-center gap-2.5">
                                            <button
                                                type="button"
                                                disabled={!!submittingAction}
                                                onClick={(e) => handleCreateTodo(e, true)}
                                                className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                {submittingAction === 'create-another' ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#BC5C29]" />
                                                ) : (
                                                    <Plus className="w-3.5 h-3.5 text-[#BC5C29]" />
                                                )}
                                                <span>
                                                    {submittingAction === 'create-another'
                                                        ? t("Saving...", "جاري الحفظ...")
                                                        : t("Save & Add Another", "حفظ وإضافة أخرى")}
                                                </span>
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={!!submittingAction}
                                                className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                                            >
                                                {submittingAction === 'create-single' && (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                )}
                                                <span>
                                                    {submittingAction === 'create-single'
                                                        ? t("Creating...", "جاري الإنشاء...")
                                                        : t("Create Point", "إنشاء النقطة")}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {modalTab === 'batch' && (
                                <form onSubmit={handleCreateBatch} className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                        <div className="flex items-center gap-2.5">
                                            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                                📅 {t("Target Date:", "تاريخ التنفيذ:")}
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                disabled={!!submittingAction}
                                                value={batchDate}
                                                onChange={(e) => setBatchDate(e.target.value)}
                                                className="orbit-task-input rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-[#BC5C29]"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                disabled={!!submittingAction}
                                                onClick={() => setBatchDate(todayStr)}
                                                className={`px-3.5 py-1.5 text-xs rounded-full font-semibold border transition cursor-pointer ${batchDate === todayStr ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                            >
                                                {t("Today", "اليوم")}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!!submittingAction}
                                                onClick={() => {
                                                    const tom = new Date();
                                                    tom.setDate(tom.getDate() + 1);
                                                    setBatchDate(tom.toISOString().split('T')[0]);
                                                }}
                                                className="px-3.5 py-1.5 text-xs rounded-full font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            >
                                                {t("Tomorrow", "غداً")}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                                        {batchRows.map((row, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800">
                                                <span className="w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold tabular-nums flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>

                                                <input
                                                    type="text"
                                                    disabled={!!submittingAction}
                                                    placeholder={t("Task title...", "اسم المهمة...")}
                                                    value={row.text}
                                                    onChange={(e) => updateBatchRow(idx, 'text', e.target.value)}
                                                    className="orbit-task-input flex-1 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29]"
                                                />

                                                <select
                                                    disabled={!!submittingAction}
                                                    value={row.category}
                                                    onChange={(e) => updateBatchRow(idx, 'category', e.target.value)}
                                                    className="orbit-task-select rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white shrink-0 focus:outline-none focus:border-[#BC5C29]"
                                                >
                                                    {TODO_CATEGORIES.map(cat => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.icon} {language === 'ar' ? cat.labelAr : cat.labelEn}
                                                        </option>
                                                    ))}
                                                </select>

                                                <select
                                                    disabled={!!submittingAction}
                                                    value={row.duration_hours}
                                                    onChange={(e) => updateBatchRow(idx, 'duration_hours', e.target.value)}
                                                    className="orbit-task-select rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-2 text-xs font-medium text-zinc-900 dark:text-white shrink-0 font-mono"
                                                >
                                                    <option value="0.25">⏱️ 15m</option>
                                                    <option value="0.5">⏱️ 30m</option>
                                                    <option value="0.75">⏱️ 45m</option>
                                                    <option value="1">⏱️ 1h</option>
                                                    <option value="1.5">⏱️ 1.5h</option>
                                                    <option value="2">⏱️ 2h</option>
                                                    <option value="3">⏱️ 3h</option>
                                                    <option value="4">⏱️ 4h</option>
                                                    <option value="8">⏱️ 8h</option>
                                                </select>

                                                <input
                                                    type="time"
                                                    disabled={!!submittingAction}
                                                    value={row.reminder_time}
                                                    onChange={(e) => updateBatchRow(idx, 'reminder_time', e.target.value)}
                                                    className="orbit-task-input rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-2 text-xs text-zinc-900 dark:text-white font-mono shrink-0"
                                                    title={t("Time (Optional)", "الوقت (اختياري)")}
                                                />

                                                <button
                                                    type="button"
                                                    disabled={!!submittingAction}
                                                    onClick={() => removeBatchRow(idx)}
                                                    className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-red-600 hover:text-white hover:border-red-600 text-zinc-400 text-xs font-medium transition flex items-center justify-center shrink-0 self-end sm:self-auto cursor-pointer"
                                                    title={t("Remove row", "حذف السطر")}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="button"
                                            disabled={!!submittingAction}
                                            onClick={addBatchRow}
                                            className="px-4 py-2 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-[#BC5C29] hover:text-[#BC5C29] transition inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>{t("Add Row", "إضافة سطر آخر")}</span>
                                        </button>

                                        <span className="text-xs text-zinc-500 font-mono tabular-nums">
                                            {batchRows.filter(r => r.text.trim()).length} / {batchRows.length} {t("ready to add", "جاهزة للإضافة")}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                                        <button
                                            type="button"
                                            disabled={!!submittingAction}
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                        >
                                            {t("Cancel", "إلغاء")}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!!submittingAction || batchRows.filter(r => r.text.trim()).length === 0}
                                            className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                                        >
                                            {submittingAction === 'create-batch' && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            )}
                                            <span>
                                                {submittingAction === 'create-batch'
                                                    ? t("Creating...", "جاري الإنشاء...")
                                                    : t(`Create All (${batchRows.filter(r => r.text.trim()).length} Points)`, `إنشاء الكل (${batchRows.filter(r => r.text.trim()).length} نقطة)`)}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modalTab === 'paste' && (
                                <form onSubmit={handleCreateQuickPaste} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                📅 {t("Target Date", "تاريخ التنفيذ")}
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                disabled={!!submittingAction}
                                                value={pasteDate}
                                                onChange={(e) => setPasteDate(e.target.value)}
                                                className="orbit-task-input w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-[#BC5C29]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                                🏷️ {t("Default Category", "التصنيف الافتراضي")}
                                            </label>
                                            <select
                                                disabled={!!submittingAction}
                                                value={pasteDefaultCategory}
                                                onChange={(e) => setPasteDefaultCategory(e.target.value)}
                                                className="orbit-task-select w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29]"
                                            >
                                                {TODO_CATEGORIES.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.icon} {language === 'ar' ? cat.labelAr : cat.labelEn}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                {t("Paste tasks (one task per line):", "الصق أو اكتب المهام (كل سطر مهمة منفصلة):")}
                                            </label>
                                            <span className="text-xs font-mono font-semibold text-[#BC5C29]">
                                                {pasteText.split('\n').map(l => l.trim()).filter(Boolean).length} {t("lines detected", "مهمة تم رصدها")}
                                            </span>
                                        </div>
                                        <textarea
                                            rows={6}
                                            disabled={!!submittingAction}
                                            value={pasteText}
                                            onChange={(e) => setPasteText(e.target.value)}
                                            placeholder={language === 'ar'
                                                ? `[عمل] مراجعة الكود والـ PRs\n[دراسة] قراءة 15 صفحة من كتاب التصميم\n[مالي] مراجعة المصاريف اليومية\n[صحة] المشي نصف ساعة\nمهمة أخرى عادية بالتصنيف الافتراضي`
                                                : `[Work] Review code and PRs\n[Study] Read 15 pages\n[Finance] Check expenses\n[Health] 30m walk\nAnother task with default category`
                                            }
                                            className="orbit-task-textarea w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#BC5C29] leading-relaxed font-mono"
                                        />
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                                            💡 {t("Tip: Prefix with category in brackets e.g. [Work] or [Study] to classify each row automatically!", "نصيحة: يمكنك كتابة [عمل] أو [دراسة] أو [شخصي] أو [مالي] أو [صحة] أو [مشاريع] في أول السطر لتصنيف كل مهمة تلقائياً!")}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                                        <button
                                            type="button"
                                            disabled={!!submittingAction}
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer"
                                        >
                                            {t("Cancel", "إلغاء")}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!!submittingAction || pasteText.split('\n').map(l => l.trim()).filter(Boolean).length === 0}
                                            className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
                                        >
                                            {submittingAction === 'create-paste' && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            )}
                                            <span>
                                                {submittingAction === 'create-paste'
                                                    ? t("Creating...", "جاري الإنشاء...")
                                                    : t(`Create All (${pasteText.split('\n').map(l => l.trim()).filter(Boolean).length} Points)`, `إنشاء الكل (${pasteText.split('\n').map(l => l.trim()).filter(Boolean).length} نقطة)`)}
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isExportModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={(e) => { if (e.target === e.currentTarget) setIsExportModalOpen(false); }}
                >
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-5">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 inline-flex items-center justify-center font-bold shrink-0 shadow-xs">
                                    📊
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Export Todo Points & Analytics", "تصدير تقرير نقاط To-Do والتحليلات")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                                        {t("Select a specific month or export all available months.", "اختر شهراً محدداً أو تصدير كل الشهور المتاحة.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                {t("Select Month to Export:", "تحديد الشهر المراد تصديره:")}
                            </label>
                            <select
                                value={selectedExportMonth}
                                onChange={(e) => setSelectedExportMonth(e.target.value)}
                                className="orbit-task-select w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white font-medium outline-none focus:border-[#BC5C29] cursor-pointer"
                            >
                                <option value="all">🌐 {t("All Available Months (Complete History)", "كل الشهور المتاحة (السجل الكامل)")}</option>
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>
                                        📅 {m} ({todoItems.filter(it => it.due_date && it.due_date.startsWith(m)).length} {t("points", "نقطة")})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                    {t("Selected Scope Summary", "ملخص النطاق المحدد")}
                                </span>
                                <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                    {selectedExportMonth === 'all' ? t("All Time", "كافة الأوقات") : selectedExportMonth}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center">
                                    <span className="text-[11px] text-zinc-500 font-medium block">{t("Total", "الإجمالي")}</span>
                                    <span className="text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-white">{exportPreviewStats.total}</span>
                                </div>

                                <div className="p-3 rounded-2xl bg-ok/10 border border-ok/25 text-center">
                                    <span className="text-[11px] text-ok font-medium block">{t("Done ✅", "صح ✅")}</span>
                                    <span className="text-base font-bold font-mono tabular-nums text-ok">{exportPreviewStats.done}</span>
                                </div>

                                <div className="p-3 rounded-2xl bg-crit/10 border border-crit/25 text-center">
                                    <span className="text-[11px] text-crit font-medium block">{t("Missed ❌", "فايتة ❌")}</span>
                                    <span className="text-base font-bold font-mono tabular-nums text-crit">{exportPreviewStats.missed}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800 font-semibold">
                                <span className="text-zinc-500">{t("Success / Completion Rate:", "معدل الإنجاز:")}</span>
                                <span className="font-mono text-ok font-bold">{exportPreviewStats.rate}%</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                            <a
                                href={`/api/todo/export?month=${selectedExportMonth}&format=csv`}
                                download
                                className="w-full flex-1 px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-full text-xs transition flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800"
                            >
                                <span>📄</span>
                                <span>{t("Export CSV (.csv)", "تصدير CSV (.csv)")}</span>
                            </a>

                            <a
                                href={`/api/todo/export?month=${selectedExportMonth}&format=excel`}
                                download
                                className="w-full flex-1 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold rounded-full text-xs transition shadow-sm flex items-center justify-center gap-2"
                            >
                                <span>📗</span>
                                <span>{t("Export Excel (.xlsx)", "تصدير إكسيل (.xlsx)")}</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Point Modal */}
            {isEditModalOpen && editItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-xs text-base">
                                    ✏️
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {t("Edit To-Do Point", "تعديل نقطة المهمة")}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        {t("Update task details, schedule, or category.", "تحديث تفاصيل المهمة أو موعدها.")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Title", "عنوان النقطة")} *
                                </label>
                                <input
                                    type="text"
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    required
                                    className="orbit-task-input w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Category", "التصنيف")}
                                    </label>
                                    <select
                                        value={editCategory}
                                        onChange={e => setEditCategory(e.target.value)}
                                        className="orbit-task-select w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none cursor-pointer focus:border-[#BC5C29] transition"
                                    >
                                        {TODO_CATEGORIES.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.icon} {language === 'ar' ? c.labelAr : c.labelEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Due Date", "تاريخ الاستحقاق")}
                                    </label>
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={e => setEditDueDate(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Reminder Time", "وقت التنبيه")}
                                    </label>
                                    <input
                                        type="time"
                                        value={editReminderTime}
                                        onChange={e => setEditReminderTime(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                        {t("Duration (Hours)", "المدة بالساعات")}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.25"
                                        max="24"
                                        value={editDurationHours}
                                        onChange={e => setEditDurationHours(e.target.value)}
                                        className="orbit-task-input w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
                                    {t("Description / Notes", "الوصف / الملاحظات")}
                                </label>
                                <textarea
                                    rows={3}
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    placeholder={t("Extra details or instructions...", "تفاصيل إضافية أو تعليمات...")}
                                    className="orbit-task-textarea w-full bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-[#BC5C29] leading-relaxed resize-none transition"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                                >
                                    {t("Cancel", "إلغاء")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    className="px-6 py-2.5 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{t("Save Changes", "حفظ التعديلات")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => !isDeleting && setDeleteTarget(null)}
                onConfirm={executeDelete}
                isDeleting={isDeleting}
                title={
                    deleteTarget?.type === 'item' ? t("Delete this item?", "حذف هذه النقطة؟") :
                        deleteTarget?.type === 'day' ? t(`Delete all items for day ${deleteTarget.dateStr}?`, `حذف جميع نقاط يوم ${deleteTarget.dateStr}؟`) :
                            t("Delete full recurring series?", "حذف سلسلة التكرار الكاملة؟")
                }
                itemName={deleteTarget?.item?.text || ''}
                message={t("This action cannot be undone.", "لا يمكن التراجع عن هذا الإجراء بعد الحذف.")}
                confirmText={t("Confirm Delete", "تأكيد الحذف")}
                cancelText={t("Cancel", "إلغاء")}
            />
        </div>
    );
}
