/**
 * Orbit Architecture v2 — Learning Service
 * Centralizes course calculation, lesson progress, and resource metrics.
 */

export function calculateCourseProgress(completedUnits = 0, totalUnits = 0) {
    const completed = Math.max(0, Number(completedUnits) || 0);
    const total = Math.max(0, Number(totalUnits) || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
}

export function computeLearningMetrics(courses = []) {
    const totalCourses = courses.length;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalUnits = 0;
    let completedUnits = 0;

    courses.forEach((c) => {
        if (c.status === 'completed' || Number(c.progress_percentage) >= 100) {
            completedCourses += 1;
        } else if (c.status === 'in_progress' || Number(c.completed_units) > 0) {
            inProgressCourses += 1;
        }
        totalUnits += Number(c.total_units || 0);
        completedUnits += Number(c.completed_units || 0);
    });

    const overallProgress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    return {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalUnits,
        completedUnits,
        overallProgress
    };
}

const serviceExports = {
    calculateCourseProgress,
    computeLearningMetrics
};

export default serviceExports;
