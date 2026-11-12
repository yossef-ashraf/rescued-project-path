import { Op } from '@/shared/database/orm.js';
import { Month, Credit, Debt, Task, TodoItem, Course, CourseFile } from '@/shared/models/index.js';
import { requireAuth, ok, unauthorized } from '@/shared/utils/response.js';
import { apiError } from '@/shared/utils/api-error.js';
import { DEBT_TYPE } from '@/shared/constants/index.js';

function buildFinanceSummary(monthsList, allCredits, allDebts, selectedMonth) {
    let runningBalance = 0;

    const monthlyFinance = monthsList.map(m => {
        const isCurrentMonth = item =>
            String(item.month_id) === String(m.id) ||
            String(item.month).toLowerCase() === String(m.month).toLowerCase();

        const mCredits = allCredits
            .filter(isCurrentMonth)
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        const mDebts = allDebts
            .filter(d => isCurrentMonth(d) && Number(d.type) === DEBT_TYPE.LIABILITY)
            .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

        const mInvestments = allDebts
            .filter(d => isCurrentMonth(d) && Number(d.type) === DEBT_TYPE.INVESTMENT)
            .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

        const mOthers = allDebts
            .filter(d => isCurrentMonth(d) && Number(d.type) === DEBT_TYPE.OTHER)
            .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

        const totalOutflows = mDebts + mInvestments + mOthers;
        const openingBalance = runningBalance;
        const netCashFlow = mCredits - totalOutflows;
        const closingBalance = openingBalance + netCashFlow;
        runningBalance = closingBalance;

        return {
            monthId: m.id,
            monthName: m.month,
            year: m.year,
            openingBalance,
            inflows: mCredits,
            outflows: totalOutflows,
            debts: mDebts,
            investments: mInvestments,
            others: mOthers,
            closingBalance,
            netCashFlow
        };
    });

    let periodOpening = monthlyFinance.length > 0 ? monthlyFinance[0].openingBalance : 0;
    let periodInflows = monthlyFinance.reduce((sum, m) => sum + m.inflows, 0);
    let periodOutflows = monthlyFinance.reduce((sum, m) => sum + m.outflows, 0);
    let periodClosing = monthlyFinance.length > 0 ? monthlyFinance[monthlyFinance.length - 1].closingBalance : 0;
    let periodNet = periodInflows - periodOutflows;

    let filteredCredits = allCredits;
    let filteredDebts = allDebts;

    if (selectedMonth && selectedMonth !== 'all') {
        const target = monthlyFinance.find(
            m => m.monthName.toLowerCase() === selectedMonth.toLowerCase() || String(m.monthId) === String(selectedMonth)
        );
        if (target) {
            periodOpening = target.openingBalance;
            periodInflows = target.inflows;
            periodOutflows = target.outflows;
            periodClosing = target.closingBalance;
            periodNet = target.netCashFlow;

            const isTargetMonth = item =>
                String(item.month_id) === String(target.monthId) ||
                String(item.month).toLowerCase() === target.monthName.toLowerCase();

            filteredCredits = allCredits.filter(isTargetMonth);
            filteredDebts = allDebts.filter(isTargetMonth);
        }
    }

    return {
        periodOpening,
        periodInflows,
        periodOutflows,
        periodClosing,
        periodNet,
        monthlyFinance,
        itemizedCredits: filteredCredits.slice(0, 50).map(c => ({
            id: c.id,
            name: c.name,
            amount: parseFloat(c.amount || 0),
            type: c.type,
            month: c.month,
            date: c.created_at
        })),
        itemizedDebts: filteredDebts.slice(0, 50).map(d => ({
            id: d.id,
            name: d.name,
            amount: parseFloat(d.amount || 0),
            type: d.type,
            month: d.month,
            date: d.created_at
        }))
    };
}

function buildTasksSummary(tasksList, todoList) {
    const totalTasksCount = tasksList.length;
    const completedTasks = tasksList.filter(t => t.status === 'done' || t.status === 'completed');
    const pendingTasks = tasksList.filter(t => t.status !== 'done' && t.status !== 'completed');

    const now = new Date();
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayTime = new Date(`${todayYMD}T00:00:00Z`).getTime();

    const overdueTasksList = [];

    for (const t of pendingTasks) {
        const dateStr = t.end_date || t.due_date;
        if (!dateStr) continue;

        const dueYMD = String(dateStr).split('T')[0];
        const dueTime = new Date(`${dueYMD}T00:00:00Z`).getTime();
        const diffDays = Math.round((todayTime - dueTime) / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            overdueTasksList.push({
                id: t.id,
                title: t.title,
                statusKey: 'pending_overdue',
                overdueDays: diffDays,
                dueDate: dueYMD
            });
        }
    }

    overdueTasksList.sort((a, b) => b.overdueDays - a.overdueDays);

    const onTimeTasksList = completedTasks.map(t => ({
        title: t.title,
        dueDate: t.due_date || t.end_date,
        completedAt: t.updated_at
    }));

    const totalTodosCount = todoList.length;
    const completedTodosCount = todoList.filter(t => Boolean(t.done) && String(t.done) !== '0').length;
    const pendingTodosCount = totalTodosCount - completedTodosCount;

    return {
        totalTasksCount,
        completedTasksCount: completedTasks.length,
        pendingTasksCount: pendingTasks.length,
        onTimeTasksCount: completedTasks.length,
        onTimeTasksList: onTimeTasksList.slice(0, 15),
        overdueTasksCount: overdueTasksList.length,
        overdueTasksList: overdueTasksList.slice(0, 15),
        totalTodosCount,
        completedTodosCount,
        pendingTodosCount,
        completionRate: totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0
    };
}

function buildCoursesSummary(coursesList, materialsList) {
    const totalCourses = coursesList.length;
    const completedCourses = coursesList.filter(c => c.status === 'completed' || Number(c.progress_percentage) >= 100);
    const inProgressCourses = coursesList.filter(c => c.status !== 'completed' && Number(c.progress_percentage) < 100);
    const totalVideos = coursesList.reduce((sum, c) => sum + (parseInt(c.total_units, 10) || 0), 0);
    const completedVideos = coursesList.reduce((sum, c) => sum + (parseInt(c.completed_units, 10) || 0), 0);

    const readMaterials = materialsList.filter(m => m.reading_status === 'read');
    const inProgressMaterials = materialsList.filter(m => m.reading_status === 'in_progress');
    const unreadMaterials = materialsList.filter(m => !m.reading_status || m.reading_status === 'unread');
    const materialsWithNotes = materialsList.filter(m => m.notes && m.notes.trim().length > 0);

    return {
        totalCourses,
        completedCoursesCount: completedCourses.length,
        completedCoursesList: completedCourses.slice(0, 15).map(c => ({
            title: c.title,
            totalUnits: c.total_units,
            category: c.category_path
        })),
        inProgressCoursesCount: inProgressCourses.length,
        totalVideos,
        completedVideos,
        courseCompletionRate: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
        totalMaterials: materialsList.length,
        readCount: readMaterials.length,
        readList: readMaterials.slice(0, 15).map(m => ({ title: m.file_name, category: m.category_name, notes: m.notes })),
        inProgressCount: inProgressMaterials.length,
        unreadCount: unreadMaterials.length,
        notesCount: materialsWithNotes.length,
        notesList: materialsWithNotes.slice(0, 10).map(m => ({ title: m.file_name, notes: m.notes }))
    };
}

const analyticsCache = new Map();
const ANALYTICS_TTL_MS = 5 * 60 * 1000;

export function invalidateAnalyticsCache() {
    analyticsCache.clear();
}

export class AnalyticsController {
    static invalidateCache() {
        invalidateAnalyticsCache();
    }

    static async getAnalytics(req) {
        try {
            const user = await requireAuth(req);
            if (!user) return unauthorized();

            const { searchParams } = new URL(req.url);
            const selectedYear = searchParams.get('year') || '2026';
            const selectedMonth = searchParams.get('month') || '';

            const cacheKey = `${selectedYear}_${selectedMonth}`;
            const cached = analyticsCache.get(cacheKey);
            if (cached && (Date.now() - cached.ts < ANALYTICS_TTL_MS)) {
                return ok(cached.data);
            }

            const yearNum = parseInt(selectedYear, 10);

            const [
                monthsList, allCredits, allDebts,
                tasksList, todoList,
                coursesList, materialsList
            ] = await Promise.all([
                Month.findAll({
                    attributes: ['id', 'month', 'year'],
                    where: { year: yearNum },
                    order: [['id', 'ASC']],
                    raw: true
                }),
                Credit.findAll({
                    attributes: ['id', 'name', 'amount', 'type', 'month_id', 'month', 'year', 'created_at'],
                    where: { year: yearNum },
                    order: [['id', 'ASC']],
                    raw: true
                }),
                Debt.findAll({
                    attributes: ['id', 'name', 'amount', 'type', 'month_id', 'month', 'year', 'created_at'],
                    where: { year: yearNum },
                    order: [['id', 'ASC']],
                    raw: true
                }),
                Task.findAll({
                    attributes: ['id', 'title', 'status', 'due_date', 'end_date', 'created_at', 'updated_at'],
                    raw: true
                }),
                TodoItem.findAll({
                    attributes: ['id', 'text', 'done', 'due_date', 'created_at', 'updated_at'],
                    raw: true
                }),
                Course.findAll({
                    attributes: ['id', 'title', 'category_path', 'resource_type', 'total_units', 'completed_units', 'progress_percentage', 'status'],
                    where: {
                        type: { [Op.ne]: 'category' },
                        [Op.or]: [
                            { include_in_stats: null },
                            { include_in_stats: 1 }
                        ]
                    },
                    raw: true
                }),
                CourseFile.findAll({
                    attributes: ['id', 'file_name', 'file_type', 'category_name', 'reading_status', 'notes'],
                    raw: true
                })
            ]);

            const finance = buildFinanceSummary(monthsList, allCredits, allDebts, selectedMonth);
            const tasks = buildTasksSummary(tasksList, todoList);
            const courses = buildCoursesSummary(coursesList, materialsList);

            const payload = {
                success: true,
                selectedYear,
                selectedMonth: selectedMonth || 'all',
                availableMonths: finance.monthlyFinance.map(m => m.monthName),
                generatedAt: new Date().toISOString(),
                finance,
                tasks,
                courses
            };

            analyticsCache.set(cacheKey, { data: payload, ts: Date.now() });

            return ok(payload);
        } catch (err) {
            return apiError(err);
        }
    }
}

export default AnalyticsController;
